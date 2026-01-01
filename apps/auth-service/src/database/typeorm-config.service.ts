import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class TypeOrmConfigService implements TypeOrmConfigService {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: this.configService.getOrThrow<AllConfigType>('database.type', {
        infer: true,
      }),
      host: this.configService.getOrThrow<AllConfigType>('database.host', {
        infer: true,
      }),
      port: this.configService.getOrThrow<AllConfigType>('database.port', {
        infer: true,
      }),
      username: this.configService.getOrThrow<AllConfigType>(
        'database.username',
        { infer: true },
      ),
      password: this.configService.getOrThrow<AllConfigType>(
        'database.password',
        { infer: true },
      ),
      database: this.configService.getOrThrow<AllConfigType>('database.name', {
        infer: true,
      }),
      synchronize: this.configService.getOrThrow<AllConfigType>(
        'database.synchronize',
        { infer: true },
      ),
      dropSchema: false,
      keepConnectionAlive: true,
      autoLoadEntities: true,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    } as TypeOrmModuleOptions;
  }
}
