import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    });

    // Handle errors to prevent crash
    pubClient.on('error', (err) => {
      console.error('Redis Pub Client Error:', err);
    });

    const subClient = pubClient.duplicate();

    subClient.on('error', (err) => {
      console.error('Redis Sub Client Error:', err);
    });

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
