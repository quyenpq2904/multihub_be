import { RefreshReq, RefreshRes } from '@multihub/shared-dtos';
import { PickType } from '@nestjs/swagger';

export class RefreshReqDto extends PickType(RefreshReq, [
  'refreshToken',
] as const) {}

export class RefreshResDto extends PickType(RefreshRes, [
  'accessToken',
  'refreshToken',
] as const) {}
