import {
  GetMessagesReq,
  GetMessagesRes,
  MarkMessageAsReadRes,
} from '@multihub/shared-dtos';
import { PickType } from '@nestjs/swagger';

export class GetMessagesReqDto extends PickType(GetMessagesReq, [
  'limit',
  'limit',
  'afterCursor',
  'beforeCursor',
] as const) {}

export class GetMessagesResDto extends PickType(GetMessagesRes, [
  'data',
  'pagination',
] as const) {}

export class MarkMessageAsReadResDto extends PickType(MarkMessageAsReadRes, [
  'success',
] as const) {}
