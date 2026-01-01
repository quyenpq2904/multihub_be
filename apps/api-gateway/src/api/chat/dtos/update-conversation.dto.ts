import { UpdateConversationReq } from '@multihub/shared-dtos';
import { PickType } from '@nestjs/swagger';

export class UpdateConversationReqDto extends PickType(UpdateConversationReq, [
  'conversationId',
  'name',
  'avatar',
] as const) {}
