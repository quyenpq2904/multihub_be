import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';
import { CreateMessageReq, CreateMessageRes } from '@multihub/shared-dtos';
import { Uuid } from '@multihub/shared-common';
import { Server, Socket } from 'socket.io';
import { SendMessageReqDto } from './dtos/send-message.dto';
import { CHAT_GATEWAY_MESSAGE } from './chat.type';

@WebSocketGateway({
  namespace: 'chat',
  cors: true,
})
export class ChatGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private chatService: ChatServiceGrpc;

  constructor(@Inject('CHAT_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.chatService = this.client.getService<ChatServiceGrpc>('ChatService');
  }

  connectedClients: { [socketId: string]: boolean } = {};

  afterInit(server: Server) {
    console.log('Server initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.connectedClients[client.id] = true;
  }

  handleDisconnect(client: Socket) {
    delete this.connectedClients[client.id];
  }

  @SubscribeMessage(CHAT_GATEWAY_MESSAGE.JOIN_ROOM)
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.join(roomId);
    client.emit(CHAT_GATEWAY_MESSAGE.JOINED_ROOM, {
      roomId,
      message: `Joined room ${roomId}`,
    });
    this.server
      .to(roomId)
      .emit(CHAT_GATEWAY_MESSAGE.USER_JOINED, { userId: client.id, roomId });
  }

  @SubscribeMessage(CHAT_GATEWAY_MESSAGE.LEAVE_ROOM)
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.leave(roomId);
    client.emit(CHAT_GATEWAY_MESSAGE.LEFT_ROOM, {
      roomId,
      message: `Left room ${roomId}`,
    });
    this.server
      .to(roomId)
      .emit(CHAT_GATEWAY_MESSAGE.USER_LEFT, { userId: client.id, roomId });
  }

  @SubscribeMessage(CHAT_GATEWAY_MESSAGE.SEND_MESSAGE)
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendMessageReqDto,
  ) {
    const createdMessage = await lastValueFrom(
      this.chatService.createMessage({
        conversationId: body.conversationId as unknown as Uuid,
        userId: body.senderId as unknown as Uuid,
        content: body.content,
        type: body.type,
      }),
    );
    const response = {
      ...createdMessage,
      tempId: body.id, // Return the tempId
    };
    this.server
      .to(body.conversationId as unknown as string)
      .emit(CHAT_GATEWAY_MESSAGE.MESSAGE, response);
  }
}

interface ChatServiceGrpc {
  createMessage(req: CreateMessageReq): Observable<CreateMessageRes>;
}
