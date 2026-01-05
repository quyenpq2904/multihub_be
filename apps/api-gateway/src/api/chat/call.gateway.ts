import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';
import { JoinChannelDto, LeaveChannelDto } from './dtos/join-channel.dto';
import { ConnectTransportDto } from './dtos/connect-transport.dto';
import { ProduceDto } from './dtos/produce.dto';
import { ConsumeDto } from './dtos/consume.dto';

interface SfuService {
  createRoom(data: { roomId: string }): Observable<{ rtpCapabilities: string }>;
  createWebRtcTransport(data: {
    roomId: string;
    peerId: string;
    direction: 'send' | 'recv';
  }): Observable<{
    id: string;
    iceParameters: string;
    iceCandidates: string;
    dtlsParameters: string;
  }>;
  connectTransport(data: {
    roomId: string;
    peerId: string;
    transportId: string;
    dtlsParameters: string;
  }): Observable<{ connected: boolean }>;
  produce(data: {
    roomId: string;
    peerId: string;
    transportId: string;
    kind: string;
    rtpParameters: string;
  }): Observable<{ producerId: string }>;
  consume(data: {
    roomId: string;
    peerId: string;
    producerId: string;
    transportId: string;
    rtpCapabilities: string;
  }): Observable<{
    consumerId: string;
    producerId: string;
    kind: string;
    rtpParameters: string;
  }>;
  getProducers(data: { roomId: string }): Observable<{
    producers: { producerId: string; peerId: string; kind: string }[];
  }>;
  getPeers(data: { roomId: string }): Observable<{ peerIds: string[] }>;
  leaveRoom(data: { roomId: string; peerId: string }): Observable<{
    success: boolean;
  }>;
}

@WebSocketGateway({
  namespace: 'call',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class CallGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private sfuService: SfuService;

  constructor(@Inject('CHAT_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.sfuService = this.client.getService<SfuService>('SfuService');
  }

  afterInit() {
    console.log(`Server initialized`);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @MessageBody() dto: LeaveChannelDto,
    @ConnectedSocket() client: Socket,
  ) {
    const rooms = Array.from(client.rooms);
    // Use stored peerId from join-room or fallback to client.id
    const peerId = client.data.peerId || client.id;

    for (const roomId of rooms) {
      if (roomId !== client.id) {
        try {
          await lastValueFrom(this.sfuService.leaveRoom({ roomId, peerId }));

          client.to(roomId).emit('peer-left', { peerId });
          client.leave(roomId);
        } catch (e) {
          console.error(`Failed to leave room ${roomId}`, e);
        }
      }
    }

    return { left: true };
  }

  @SubscribeMessage('join-room')
  async handleJoinChannel(
    @MessageBody() dto: JoinChannelDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, peerId } = dto;

    try {
      // 1. Create Room (ensure it exists)
      const roomRes = await lastValueFrom(
        this.sfuService.createRoom({ roomId }),
      );

      // 2. Create Transports
      const sendTransportRes = await lastValueFrom(
        this.sfuService.createWebRtcTransport({
          roomId,
          peerId,
          direction: 'send',
        }),
      );

      const recvTransportRes = await lastValueFrom(
        this.sfuService.createWebRtcTransport({
          roomId,
          peerId,
          direction: 'recv',
        }),
      );

      client.join(roomId);
      client.data.peerId = peerId;

      // 3. Get existing producers
      const producersRes = await lastValueFrom(
        this.sfuService.getProducers({ roomId }),
      );

      // 4. Get active peers (now using dedicated RPC)
      const peersRes = await lastValueFrom(
        this.sfuService.getPeers({ roomId }),
      );
      const peerIds = peersRes.peerIds;

      client.emit('update-peer-list', { peerIds });

      // Notify others
      client.to(roomId).emit('new-peer', { peerId });

      return {
        sendTransportOptions: {
          id: sendTransportRes.id,
          iceParameters: JSON.parse(sendTransportRes.iceParameters),
          iceCandidates: JSON.parse(sendTransportRes.iceCandidates),
          dtlsParameters: JSON.parse(sendTransportRes.dtlsParameters),
        },
        recvTransportOptions: {
          id: recvTransportRes.id,
          iceParameters: JSON.parse(recvTransportRes.iceParameters),
          iceCandidates: JSON.parse(recvTransportRes.iceCandidates),
          dtlsParameters: JSON.parse(recvTransportRes.dtlsParameters),
        },
        rtpCapabilities: JSON.parse(roomRes.rtpCapabilities),
        peerIds,
        existingProducers: producersRes.producers,
      };
    } catch (error) {
      console.error(error);
      client.emit('join-room-error', { error: error.message || error });
    }
  }

  @SubscribeMessage('connect-transport')
  async handleConnectTransport(@MessageBody() data: ConnectTransportDto) {
    const { roomId, peerId, dtlsParameters, transportId } = data;
    try {
      await lastValueFrom(
        this.sfuService.connectTransport({
          roomId,
          peerId,
          transportId,
          dtlsParameters: JSON.stringify(dtlsParameters),
        }),
      );
      return { connected: true };
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  }

  @SubscribeMessage('produce')
  async handleProduce(
    @MessageBody() data: ProduceDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, peerId, kind, transportId, rtpParameters } = data;
    try {
      const res = await lastValueFrom(
        this.sfuService.produce({
          roomId,
          peerId,
          kind,
          transportId,
          rtpParameters: JSON.stringify(rtpParameters),
        }),
      );

      // Notify others
      client.to(roomId).emit('new-producer', {
        producerId: res.producerId,
        peerId,
        kind,
      });

      return { producerId: res.producerId };
    } catch (error) {
      console.error(error);
      client.emit('produce-error', { error: error.message });
    }
  }

  @SubscribeMessage('consume')
  async handleConsume(
    @MessageBody() data: ConsumeDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, peerId, producerId, rtpCapabilities, transportId } = data;
    try {
      const res = await lastValueFrom(
        this.sfuService.consume({
          roomId,
          peerId,
          producerId,
          transportId,
          rtpCapabilities: JSON.stringify(rtpCapabilities),
        }),
      );

      return {
        consumerData: {
          id: res.consumerId,
          producerId: res.producerId,
          kind: res.kind,
          rtpParameters: JSON.parse(res.rtpParameters),
        },
      };
    } catch (error) {
      console.error(error);
      client.emit('consume-error', { error: error.message });
    }
  }
}
