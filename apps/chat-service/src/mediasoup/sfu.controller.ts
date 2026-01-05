import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RoomService } from './room/room.service';
import { TransportService } from './transport/transport.service';
import { ProducerConsumerService } from './producer-consumer/producer-consumer.service';

@Controller()
export class SfuController {
  constructor(
    private readonly roomService: RoomService,
    private readonly transportService: TransportService,
    private readonly producerConsumerService: ProducerConsumerService,
  ) {}

  @GrpcMethod('SfuService', 'GetProducers')
  async getProducers(data: { roomId: string }) {
    const room = this.roomService.getRoom(data.roomId);
    const producers = [];
    if (room) {
      for (const [peerId, peer] of room.peers) {
        for (const [producerId, producerData] of peer.producers) {
          producers.push({
            producerId: producerId,
            peerId: peerId,
            kind: producerData.producer.kind,
          });
        }
      }
    }
    return { producers };
  }

  @GrpcMethod('SfuService', 'GetPeers')
  async getPeers(data: { roomId: string }) {
    const room = this.roomService.getRoom(data.roomId);
    const peerIds = room ? Array.from(room.peers.keys()) : [];
    return { peerIds };
  }

  @GrpcMethod('SfuService', 'LeaveRoom')
  async leaveRoom(data: { roomId: string; peerId: string }) {
    const room = this.roomService.getRoom(data.roomId);
    if (room) {
      const peer = room.peers.get(data.peerId);
      if (peer) {
        peer.producers.forEach((p) => p.producer.close());
        peer.consumers.forEach((c) => c.consumer.close());
        peer.transports.forEach((t) => t.transport.close());
        room.peers.delete(data.peerId);

        // If room empty, remove room?
        // Original logic: if (room.peers.size === 0) this.roomService.removeRoom(roomId);
        if (room.peers.size === 0) {
          this.roomService.removeRoom(data.roomId);
        }
      }
    }
    return { success: true };
  }

  @GrpcMethod('SfuService', 'CreateRoom')
  async createRoom(data: { roomId: string }) {
    const room = await this.roomService.createRoom(data.roomId);
    return {
      rtpCapabilities: JSON.stringify(room.router.router.rtpCapabilities),
    };
  }

  @GrpcMethod('SfuService', 'CreateWebRtcTransport')
  async createWebRtcTransport(data: {
    roomId: string;
    peerId: string;
    direction: 'send' | 'recv';
  }) {
    const transport = await this.transportService.createWebRtcTransport(
      data.roomId,
      data.peerId,
      data.direction,
    );
    return {
      id: transport.id,
      iceParameters: JSON.stringify(transport.iceParameters),
      iceCandidates: JSON.stringify(transport.iceCandidates),
      dtlsParameters: JSON.stringify(transport.dtlsParameters),
    };
  }

  @GrpcMethod('SfuService', 'ConnectTransport')
  async connectTransport(data: {
    roomId: string;
    peerId: string;
    transportId: string;
    dtlsParameters: string;
  }) {
    const room = this.roomService.getRoom(data.roomId);
    const peer = room?.peers.get(data.peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }
    const transportData = peer.transports.get(data.transportId);
    if (!transportData) {
      throw new Error('Transport not found');
    }
    await transportData.transport.connect({
      dtlsParameters: JSON.parse(data.dtlsParameters),
    });
    return { connected: true };
  }

  @GrpcMethod('SfuService', 'Produce')
  async produce(data: {
    roomId: string;
    peerId: string;
    transportId: string;
    kind: any;
    rtpParameters: string;
  }) {
    const producerId = await this.producerConsumerService.createProducer({
      roomId: data.roomId,
      peerId: data.peerId,
      transportId: data.transportId,
      kind: data.kind,
      rtpParameters: JSON.parse(data.rtpParameters),
    });
    return { producerId };
  }

  @GrpcMethod('SfuService', 'Consume')
  async consume(data: {
    roomId: string;
    peerId: string;
    producerId: string;
    transportId: string;
    rtpCapabilities: string;
  }) {
    const result = await this.producerConsumerService.createConsumer({
      roomId: data.roomId,
      peerId: data.peerId,
      producerId: data.producerId,
      transportId: data.transportId,
      rtpCapabilities: JSON.parse(data.rtpCapabilities),
    });
    return {
      consumerId: result.id,
      producerId: result.producerId,
      kind: result.kind,
      rtpParameters: JSON.stringify(result.rtpParameters),
    };
  }
}
