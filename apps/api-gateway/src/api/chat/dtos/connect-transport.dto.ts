import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class ConnectTransportDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  peerId: string;

  @IsString()
  @IsNotEmpty()
  transportId: string;

  @IsObject()
  @IsNotEmpty()
  dtlsParameters: any;
}
