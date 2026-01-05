import { Module } from '@nestjs/common';
import { MediaSoupService } from './mediasoup.service';
import { RoomModule } from './room/room.module';
import { TransportModule } from './transport/transport.module';
import { ProducerConsumerModule } from './producer-consumer/producer-consumer.module';

import { SfuController } from './sfu.controller';

@Module({
  imports: [RoomModule, TransportModule, ProducerConsumerModule],
  controllers: [SfuController],
  providers: [MediaSoupService],
  exports: [
    MediaSoupService,
    RoomModule,
    TransportModule,
    ProducerConsumerModule,
  ],
})
export class MediaSoupModule {}
