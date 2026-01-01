import { RegisterReq, RegisterRes } from '@multihub/shared-dtos';
import { PickType } from '@nestjs/swagger';

export class RegisterReqDto extends PickType(RegisterReq, [
  'email',
  'password',
  'fullName',
] as const) {}

export class RegisterResDto extends PickType(RegisterRes, [
  'userId',
] as const) {}
