import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class TypeOrmConfigService implements TypeOrmConfigService {
  constructor(private configService: ConfigService<AllConfigType>) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: this.configService.getOrThrow('database.type', { infer: true }),
      host: this.configService.getOrThrow('database.host', { infer: true }),
      port: this.configService.getOrThrow('database.port', { infer: true }),
      username: this.configService.getOrThrow('database.username', {
        infer: true,
      }),
      password: this.configService.getOrThrow('database.password', {
        infer: true,
      }),
      database: this.configService.getOrThrow('database.name', { infer: true }),
      synchronize: this.configService.getOrThrow('database.synchronize', {
        infer: true,
      }),
      dropSchema: false,
      keepConnectionAlive: true,
      autoLoadEntities: true,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    } as TypeOrmModuleOptions;
  }
}
