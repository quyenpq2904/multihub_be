import {
  CreateConversationReq,
  CreateConversationRes,
} from '@multihub/shared-dtos';
import { PickType } from '@nestjs/swagger';

export class CreateConversationReqDto extends PickType(CreateConversationReq, [
  'users',
] as const) {}

export class CreateConversationResDto extends PickType(CreateConversationRes, [
  'id',
] as const) {}
