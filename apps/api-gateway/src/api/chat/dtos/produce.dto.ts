import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class ProduceDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  peerId: string;

  @IsString()
  @IsNotEmpty()
  transportId: string;

  @IsString()
  @IsNotEmpty()
  kind: string;

  @IsObject()
  @IsNotEmpty()
  rtpParameters: any;
}
