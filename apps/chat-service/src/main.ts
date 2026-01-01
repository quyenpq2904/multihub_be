import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from './config/config.type';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AllConfigType>);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'chat',
      protoPath: join(__dirname, 'protos/chat.proto'),
      url: configService.getOrThrow('app.grpcUrl', { infer: true }),
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'chat',
        brokers: [configService.getOrThrow('app.kafkaBroker', { infer: true })],
      },
      consumer: {
        groupId: 'chat-consumer',
      },
    },
  });

  await app.startAllMicroservices();
}

bootstrap();
