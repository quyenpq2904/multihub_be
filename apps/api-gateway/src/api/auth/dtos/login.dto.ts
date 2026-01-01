import { LoginReq, LoginRes } from '@multihub/shared-dtos';
import { PickType } from '@nestjs/swagger';

export class LoginReqDto extends PickType(LoginReq, [
  'email',
  'password',
] as const) {}

export class LoginResDto extends PickType(LoginRes, [
  'userId',
  'accessToken',
  'refreshToken',
] as const) {}
