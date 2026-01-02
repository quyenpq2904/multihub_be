import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { AllConfigType } from '../config/config.type';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    super();
  }

  async connectToRedis(): Promise<void> {
    const pubClient = new Redis({
      host: this.configService.getOrThrow('app.redisHost', {
        infer: true,
      }),
      port:
        parseInt(
          this.configService.getOrThrow('app.redisPort', {
            infer: true,
          }),
          10,
        ) || 6379,
      username: this.configService.getOrThrow('app.redisUsername', {
        infer: true,
      }),
      password: this.configService.getOrThrow('app.redisPassword', {
        infer: true,
      }),
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
