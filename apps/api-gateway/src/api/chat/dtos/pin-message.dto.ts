import { ApiProperty } from '@nestjs/swagger';
import {
  PinMessageRes,
  UnpinMessageRes,
  GetPinnedMessagesRes,
  PinnedMessage,
} from '@multihub/shared-dtos';
import { Uuid } from '@multihub/shared-common';

export class PinMessageResDto implements PinMessageRes {
  @ApiProperty({ example: true })
  success: boolean;
}

export class UnpinMessageResDto implements UnpinMessageRes {
  @ApiProperty({ example: true })
  success: boolean;
}

export class PinnedMessageDto implements PinnedMessage {
  @ApiProperty()
  id: Uuid;

  @ApiProperty()
  messageId: Uuid;

  @ApiProperty()
  pinnedAt: string;
}

export class GetPinnedMessagesResDto implements GetPinnedMessagesRes {
  @ApiProperty({ type: [PinnedMessageDto] })
  messages: PinnedMessageDto[];
}
