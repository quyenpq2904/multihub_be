import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { DataSource, DataSourceOptions } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { SessionEntity } from './entities/session.entity';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { databaseConfig } from './database/config/database.config';
import { AllConfigType } from './config/config.type';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        inject: [ConfigService],
        useFactory: (configService: ConfigService<AllConfigType>) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'auth',
              brokers: [
                configService.getOrThrow<AllConfigType>('app.kafkaBroker', {
                  infer: true,
                }),
              ],
            },
            consumer: {
              groupId: 'auth-producer',
            },
          },
        }),
      },
    ]),
    JwtModule.register({}),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return new DataSource(options).initialize();
      },
    }),
    TypeOrmModule.forFeature([UserEntity, SessionEntity]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
