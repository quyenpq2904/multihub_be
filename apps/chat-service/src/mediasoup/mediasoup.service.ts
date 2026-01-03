import { Injectable, OnModuleInit } from '@nestjs/common';
import { IWorker } from './media-resources.type';
import * as os from 'os';
import * as mediasoup from 'mediasoup';

@Injectable()
export class MediaSoupService implements OnModuleInit {
  private nextWorkerIndex = 0;
  private workers: IWorker[] = [];

  public async onModuleInit() {
    const numWorkers = os.cpus().length;
    for (let i = 0; i < numWorkers; i++) {
      await this.createWorker();
    }
  }

  private async createWorker() {
    const worker = await mediasoup.createWorker({
      rtcMinPort: 6002,
      rtcMaxPort: 6202,
    });

    worker.on('died', () => {
      console.error('mediasoup worker has died');
      setTimeout(() => process.exit(1), 2000);
    });

    this.workers.push({ worker, routers: new Map() });
    return worker;
  }

  public getWorker() {
    const worker = this.workers[this.nextWorkerIndex].worker;
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    return worker;
  }
}
