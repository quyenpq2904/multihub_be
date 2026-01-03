import { Injectable } from '@nestjs/common';
import { RoomService } from '../room/room.service';
import { ITransportOptions } from './transport.type';
import { WebRtcTransport } from 'mediasoup/node/lib/WebRtcTransportTypes';

@Injectable()
export class TransportService {
  constructor(private readonly roomService: RoomService) {}

  public async createWebRtcTransport(
    roomId: string,
    peerId: string,
    direction: 'send' | 'recv',
  ): Promise<ITransportOptions> {
    const room = this.roomService.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const transport: WebRtcTransport =
      await room.router.router.createWebRtcTransport({
        listenIps: [
          {
            ip: process.env.WEBRTC_LISTEN_IP || '127.0.0.1',
            announcedIp: process.env.WEBRTC_ANNOUNCED_IP || '127.0.0.1',
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        appData: {
          peerId,
          clientDirection: direction,
        },
      });

    this.roomService.addPeerToRoom(roomId, peerId);

    const peer = room.peers.get(peerId);
    peer.transports.set(transport.id, { transport });

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }
}
