import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

import { REDIS_CLIENT } from './redis.constants';
import { AllConfigType } from '../config/config.type';

@Global()
@Module({
  imports: [],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService<AllConfigType>) => {
        return new Redis({
          host: config.getOrThrow('app.redisHost', {
            infer: true,
          }),
          port: config.getOrThrow('app.redisPort', {
            infer: true,
          }),
          username: config.getOrThrow('app.redisUsername', {
            infer: true,
          }),
          password: config.getOrThrow('app.redisPassword', {
            infer: true,
          }),
        });
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
