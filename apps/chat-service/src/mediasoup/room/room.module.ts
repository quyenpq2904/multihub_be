import { forwardRef, Module } from '@nestjs/common';
import { MediaSoupModule } from '../mediasoup.module';
import { RoomService } from './room.service';

@Module({
  imports: [forwardRef(() => MediaSoupModule)],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
