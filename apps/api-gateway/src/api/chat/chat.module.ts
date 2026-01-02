import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'CHAT_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService<AllConfigType>) => ({
          transport: Transport.GRPC,
          options: {
            package: 'chat',
            protoPath: [join(__dirname, 'protos/chat.proto')],
            url: configService.getOrThrow('app.chatGrpcUrl', { infer: true }),
          },
        }),
      },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatGateway],
})
export class ChatModule {}
