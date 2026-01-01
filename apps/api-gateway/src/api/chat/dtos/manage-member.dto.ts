import {
  AddMemberReq,
  RemoveMemberReq,
  AddMemberRes,
  RemoveMemberRes,
} from '@multihub/shared-dtos';
import { PickType } from '@nestjs/swagger';

export class AddMemberReqDto extends PickType(AddMemberReq, [
  'conversationId',
  'memberId',
] as const) {}

export class RemoveMemberReqDto extends PickType(RemoveMemberReq, [
  'conversationId',
  'memberId',
] as const) {}

export class AddMemberResDto extends PickType(AddMemberRes, [
  'success',
  'conversationId',
] as const) {}

export class RemoveMemberResDto extends PickType(RemoveMemberRes, [
  'success',
  'conversationId',
] as const) {}
