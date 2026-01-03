import { Module } from '@nestjs/common';
import { RoomModule } from '../room/room.module';

@Module({
  imports: [RoomModule],
  providers: [],
  exports: [],
})
export class ProducerConsumerModule {}
