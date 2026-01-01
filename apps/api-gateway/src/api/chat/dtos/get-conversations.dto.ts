import { PickType } from '@nestjs/swagger';
import {
  ConversationDto,
  GetConversationsReq,
  GetConversationsRes,
} from '@multihub/shared-dtos';

export class GetConversationResDto extends PickType(ConversationDto, [
  'id',
  'name',
  'avatar',
  'type',
  'participants',
] as const) {}

export class GetConversationsListResDto extends PickType(GetConversationsRes, [
  'data',
  'pagination',
] as const) {}

export class GetConversationsReqDto extends PickType(GetConversationsReq, [
  'limit',
  'afterCursor',
  'beforeCursor',
] as const) {}
