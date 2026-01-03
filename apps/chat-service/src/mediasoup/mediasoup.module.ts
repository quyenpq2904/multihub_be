import { Module } from '@nestjs/common';
import { MediaSoupService } from './mediasoup.service';

@Module({
  providers: [MediaSoupService],
})
export class MediaSoupModule {}
