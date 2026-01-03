import { Module } from '@nestjs/common';
import { MediaSoupService } from './mediasoup.service';
import { RoomModule } from './room/room.module';
import { TransportModule } from './transport/transport.module';
import { ProducerConsumerModule } from './producer-consumer/producer-consumer.module';

@Module({
  imports: [RoomModule, TransportModule, ProducerConsumerModule],
  providers: [MediaSoupService],
  exports: [
    MediaSoupService,
    RoomModule,
    TransportModule,
    ProducerConsumerModule,
  ],
})
export class MediaSoupModule {}
