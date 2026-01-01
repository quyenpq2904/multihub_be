import { Uuid } from '@multihub/shared-common';

export class SendMessageReqDto {
  id: Uuid;
  content: string;
  senderId: Uuid;
  conversationId: Uuid;
  createdAt: string;
  type: string;
}

export class SendMessageResDto extends SendMessageReqDto {
  tempId: Uuid;
}
