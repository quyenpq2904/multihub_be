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

@WebSocketGateway()
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

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.join(roomId);
    client.emit('joinedRoom', { roomId, message: `Joined room ${roomId}` });
    this.server.to(roomId).emit('userJoined', { userId: client.id, roomId });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.leave(roomId);
    client.emit('leftRoom', { roomId, message: `Left room ${roomId}` });
    this.server.to(roomId).emit('userLeft', { userId: client.id, roomId });
  }

  @SubscribeMessage('sendMessage')
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
      .emit('message', response);
  }
}

interface ChatServiceGrpc {
  createMessage(req: CreateMessageReq): Observable<CreateMessageRes>;
}
