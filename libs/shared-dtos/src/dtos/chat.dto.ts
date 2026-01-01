import { Exclude, Expose } from 'class-transformer';
import {
  UUIDField,
  UUIDFieldOptional,
  StringField,
  StringFieldOptional,
  NumberField,
  BooleanField,
  ClassField,
  CursorPageOptionsDto,
  CursorPaginatedDto,
} from '@multihub/shared-common';
import { Uuid } from '@multihub/shared-common';

export class CreateConversationReq {
  @UUIDField({
    each: true,
  })
  users: Uuid[];

  @UUIDField()
  createrId: Uuid;
}

@Exclude()
export class CreateConversationRes {
  @Expose()
  @UUIDField()
  id: Uuid;
}

export class GetConversationsReq extends CursorPageOptionsDto {
  @UUIDField()
  userId: Uuid;
}

export class MessageDto {
  @UUIDField()
  id: Uuid;

  @StringField()
  content: string;

  @UUIDField()
  senderId: Uuid;

  @UUIDField()
  conversationId: Uuid;

  @StringField()
  createdAt: string;

  @StringField()
  type: string;

  @UUIDFieldOptional()
  parentMessageId?: Uuid;
}

export class GetMessagesReq extends CursorPageOptionsDto {
  @UUIDField()
  conversationId: Uuid;

  @UUIDField()
  userId: Uuid;
}

export class GetMessagesRes extends CursorPaginatedDto<MessageDto> {}

export class CreateMessageReq {
  @UUIDField()
  conversationId: Uuid;

  @UUIDField()
  userId: Uuid;

  @StringField()
  content: string;

  @StringField()
  type: string;

  @UUIDFieldOptional()
  parentMessageId?: Uuid;
}

export class CreateMessageRes {
  @UUIDField()
  id: Uuid;

  @StringField()
  content: string;

  @UUIDField()
  senderId: Uuid;

  @UUIDField()
  conversationId: Uuid;

  @StringField()
  createdAt: string;

  @StringField()
  type: string;

  @UUIDFieldOptional()
  parentMessageId?: Uuid;
}

export class MarkMessageAsReadReq {
  @UUIDField()
  conversationId: Uuid;

  @UUIDField()
  messageId: Uuid;

  @UUIDField()
  userId: Uuid;
}

export class MarkMessageAsReadRes {
  @BooleanField()
  success: boolean;
}

export class ConversationParticipantDto {
  @UUIDField()
  id: Uuid;

  @StringField()
  fullName: string;

  @StringField()
  avatar: string;

  @StringField()
  role: string;

  @StringField()
  email: string;
}

export class ConversationDto {
  @UUIDField()
  id: Uuid;

  @StringFieldOptional()
  name?: string;

  @StringFieldOptional()
  avatar?: string;

  @StringField()
  type: string;

  @ClassField(() => ConversationParticipantDto, { each: true })
  participants: ConversationParticipantDto[];
}

export class GetConversationsRes extends CursorPaginatedDto<ConversationDto> {}

export class AddMemberReq {
  @UUIDField()
  conversationId: Uuid;

  @UUIDField()
  userId: Uuid; // Requester

  @UUIDField()
  memberId: Uuid; // To add
}

export class AddMemberRes {
  @BooleanField()
  success: boolean;

  @UUIDField()
  conversationId: Uuid;
}

export class RemoveMemberReq {
  @UUIDField()
  conversationId: Uuid;

  @UUIDField()
  userId: Uuid; // Requester

  @UUIDField()
  memberId: Uuid; // To remove
}

export class RemoveMemberRes {
  @BooleanField()
  success: boolean;

  @UUIDField()
  conversationId: Uuid;
}

export class UpdateConversationReq {
  @UUIDField()
  conversationId: Uuid;

  @UUIDField()
  userId: Uuid; // Requester

  @StringFieldOptional()
  name?: string;

  @StringFieldOptional()
  avatar?: string;
}

export class UpdateConversationRes {
  @UUIDField()
  id: Uuid;

  @StringField()
  name: string;

  @StringField()
  avatar: string;
}

export class GetConversationReq {
  @UUIDField()
  conversationId: Uuid;

  @UUIDField()
  userId: Uuid;
}
export class Conversation extends ConversationDto {}

export class DeleteConversationReq {
  @UUIDField()
  conversationId: Uuid;
  @UUIDField()
  userId: Uuid;
}
export class DeleteConversationRes {
  @BooleanField()
  success: boolean;
}

export class DeleteMessageReq {
  @UUIDField()
  conversationId: Uuid;
  @UUIDField()
  messageId: Uuid;
  @UUIDField()
  userId: Uuid;
}
export class DeleteMessageRes {
  @BooleanField()
  success: boolean;
}

export class AddReactionReq {
  @UUIDField()
  messageId: Uuid;
  @UUIDField()
  userId: Uuid;
  @StringField()
  emoji: string;
}
export class AddReactionRes {
  @BooleanField()
  success: boolean;
}
export class RemoveReactionReq {
  @UUIDField()
  messageId: Uuid;
  @UUIDField()
  userId: Uuid;
  @StringField()
  emoji: string;
}
export class RemoveReactionRes {
  @BooleanField()
  success: boolean;
}
export class GetReactionsReq {
  @UUIDField()
  messageId: Uuid;
}
export class Reaction {
  @UUIDField()
  id: Uuid;
  @UUIDField()
  userId: Uuid;
  @StringField()
  emoji: string;
}
export class GetReactionsRes {
  @ClassField(() => Reaction, { each: true })
  reactions: Reaction[];
}

export class ToggleMuteReq {
  @UUIDField()
  conversationId: Uuid;
  @UUIDField()
  userId: Uuid;
}
export class ToggleMuteRes {
  @BooleanField()
  isMuted: boolean;
}
export class GetMuteStatusReq {
  @UUIDField()
  conversationId: Uuid;
  @UUIDField()
  userId: Uuid;
}
export class GetMuteStatusRes {
  @BooleanField()
  isMuted: boolean;
}

export class PinMessageReq {
  @UUIDField()
  conversationId: Uuid;
  @UUIDField()
  messageId: Uuid;
  @UUIDField()
  userId: Uuid;
}
export class PinMessageRes {
  @BooleanField()
  success: boolean;
}
export class UnpinMessageReq {
  @UUIDField()
  conversationId: Uuid;
  @UUIDField()
  messageId: Uuid;
  @UUIDField()
  userId: Uuid;
}
export class UnpinMessageRes {
  @BooleanField()
  success: boolean;
}
export class GetPinnedMessagesReq {
  @UUIDField()
  conversationId: Uuid;
}
export class PinnedMessage {
  @UUIDField()
  id: Uuid;
  @UUIDField()
  messageId: Uuid;
  @StringField()
  pinnedAt: string;
}
export class GetPinnedMessagesRes {
  @ClassField(() => PinnedMessage, { each: true })
  messages: PinnedMessage[];
}

export class GetUnreadCountReq {
  @UUIDField()
  conversationId: Uuid;
  @UUIDField()
  userId: Uuid;
}
export class GetUnreadCountRes {
  @NumberField()
  count: number;
}

export class MarkConversationAsReadReq {
  @UUIDField()
  conversationId: Uuid;
  @UUIDField()
  userId: Uuid;
}
export class MarkConversationAsReadRes {
  @BooleanField()
  success: boolean;
}

export class UploadFileReq {
  @StringField()
  filename: string;
  @UUIDField()
  userId: Uuid;
}
export class UploadFileRes {
  @StringField()
  url: string;
}
export class GetFileReq {
  @UUIDField()
  fileId: Uuid;
}
export class GetFileRes {
  @StringField()
  url: string;
}
