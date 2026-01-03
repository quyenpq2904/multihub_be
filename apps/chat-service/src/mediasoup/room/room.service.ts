import { Injectable } from '@nestjs/common';
import { MediaSoupService } from '../mediasoup.service';
import { IRoom } from './room.type';

@Injectable()
export class RoomService {
  private rooms: Map<string, any> = new Map();
  constructor(private readonly mediaSoupService: MediaSoupService) {}

  public async createRoom(roomId: string): Promise<any> {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId);
    }

    const worker = this.mediaSoupService.getWorker();
    const router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 300,
          },
        },
      ],
    });
    const newRoom: IRoom = {
      id: roomId,
      router: { router },
      peers: new Map(),
    };

    this.rooms.set(roomId, newRoom);
    return newRoom;
  }

  public getRoom(roomId: string): IRoom | undefined {
    return this.rooms.get(roomId);
  }

  public removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  public addPeerToRoom(roomId: string, peerId: string) {
    const room = this.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (!room.peers.has(peerId)) {
      room.peers.set(peerId, {
        id: peerId,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
      });
    }
  }

  public removePeerFromRoom(roomId: string, peerId: string) {
    const room = this.getRoom(roomId);
    if (room) {
      room.peers.delete(peerId);
    }
  }
}
