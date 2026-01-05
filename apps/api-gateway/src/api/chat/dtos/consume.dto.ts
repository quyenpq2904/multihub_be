import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class ConsumeDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  peerId: string;

  @IsString()
  @IsNotEmpty()
  producerId: string;

  @IsString()
  @IsNotEmpty()
  transportId: string;

  @IsObject()
  @IsNotEmpty()
  rtpCapabilities: any;
}
