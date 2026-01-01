import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateConversationReq,
  CreateConversationRes,
  GetConversationsReq,
  GetConversationsRes,
  UserCreatedEvent,
  AddMemberReq,
  AddMemberRes,
  RemoveMemberReq,
  RemoveMemberRes,
  UpdateConversationReq,
  UpdateConversationRes,
  GetMessagesReq,
  GetMessagesRes,
  MarkMessageAsReadReq,
  MarkMessageAsReadRes,
  CreateMessageReq,
  CreateMessageRes,
  GetConversationReq,
  DeleteConversationReq,
  DeleteConversationRes,
  DeleteMessageReq,
  DeleteMessageRes,
  AddReactionReq,
  AddReactionRes,
  RemoveReactionReq,
  RemoveReactionRes,
  GetReactionsReq,
  GetReactionsRes,
  ToggleMuteReq,
  ToggleMuteRes,
  GetMuteStatusReq,
  GetMuteStatusRes,
  PinMessageReq,
  PinMessageRes,
  UnpinMessageReq,
  UnpinMessageRes,
  GetPinnedMessagesReq,
  GetPinnedMessagesRes,
  MarkConversationAsReadReq,
  MarkConversationAsReadRes,
  GetUnreadCountReq,
  GetUnreadCountRes,
  UploadFileReq,
  UploadFileRes,
  GetFileReq,
  GetFileRes,
  Conversation,
} from '@multihub/shared-dtos';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @GrpcMethod('ChatService', 'CreateConversation')
  async createConversation(
    dto: CreateConversationReq,
  ): Promise<CreateConversationRes> {
    return await this.appService.createConversation(dto);
  }

  @GrpcMethod('ChatService', 'GetConversations')
  async getConversations(
    dto: GetConversationsReq,
  ): Promise<GetConversationsRes> {
    return await this.appService.getConversations(dto);
  }

  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: UserCreatedEvent): Promise<void> {
    await this.appService.createUser({
      ...data,
      avatar: data.avatar || '',
    });
  }

  @GrpcMethod('ChatService', 'AddMember')
  async addMember(dto: AddMemberReq): Promise<AddMemberRes> {
    return await this.appService.addMember(dto);
  }

  @GrpcMethod('ChatService', 'RemoveMember')
  async removeMember(dto: RemoveMemberReq): Promise<RemoveMemberRes> {
    return await this.appService.removeMember(dto);
  }

  @GrpcMethod('ChatService', 'UpdateConversation')
  async updateConversation(
    dto: UpdateConversationReq,
  ): Promise<UpdateConversationRes> {
    return await this.appService.updateConversation(dto);
  }

  @GrpcMethod('ChatService', 'GetMessages')
  async getMessages(dto: GetMessagesReq): Promise<GetMessagesRes> {
    return await this.appService.getMessages(dto);
  }

  @GrpcMethod('ChatService', 'MarkMessageAsRead')
  async markMessageAsRead(
    dto: MarkMessageAsReadReq,
  ): Promise<MarkMessageAsReadRes> {
    return await this.appService.markMessageAsRead(dto);
  }

  @GrpcMethod('ChatService', 'CreateMessage')
  async createMessage(dto: CreateMessageReq): Promise<CreateMessageRes> {
    return await this.appService.createMessage(dto);
  }

  @GrpcMethod('ChatService', 'GetConversation')
  async getConversation(dto: GetConversationReq): Promise<Conversation> {
    return await this.appService.getConversation(dto);
  }

  @GrpcMethod('ChatService', 'DeleteConversation')
  async deleteConversation(
    dto: DeleteConversationReq,
  ): Promise<DeleteConversationRes> {
    return await this.appService.deleteConversation(dto);
  }

  @GrpcMethod('ChatService', 'DeleteMessage')
  async deleteMessage(dto: DeleteMessageReq): Promise<DeleteMessageRes> {
    return await this.appService.deleteMessage(dto);
  }

  @GrpcMethod('ChatService', 'AddReaction')
  async addReaction(dto: AddReactionReq): Promise<AddReactionRes> {
    return await this.appService.addReaction(dto);
  }

  @GrpcMethod('ChatService', 'RemoveReaction')
  async removeReaction(dto: RemoveReactionReq): Promise<RemoveReactionRes> {
    return await this.appService.removeReaction(dto);
  }

  @GrpcMethod('ChatService', 'GetReactions')
  async getReactions(dto: GetReactionsReq): Promise<GetReactionsRes> {
    return await this.appService.getReactions(dto);
  }

  @GrpcMethod('ChatService', 'ToggleMute')
  async toggleMute(dto: ToggleMuteReq): Promise<ToggleMuteRes> {
    return await this.appService.toggleMute(dto);
  }

  @GrpcMethod('ChatService', 'GetMuteStatus')
  async getMuteStatus(dto: GetMuteStatusReq): Promise<GetMuteStatusRes> {
    return await this.appService.getMuteStatus(dto);
  }

  @GrpcMethod('ChatService', 'PinMessage')
  async pinMessage(dto: PinMessageReq): Promise<PinMessageRes> {
    return await this.appService.pinMessage(dto);
  }

  @GrpcMethod('ChatService', 'UnpinMessage')
  async unpinMessage(dto: UnpinMessageReq): Promise<UnpinMessageRes> {
    return await this.appService.unpinMessage(dto);
  }

  @GrpcMethod('ChatService', 'GetPinnedMessages')
  async getPinnedMessages(
    dto: GetPinnedMessagesReq,
  ): Promise<GetPinnedMessagesRes> {
    return await this.appService.getPinnedMessages(dto);
  }

  @GrpcMethod('ChatService', 'MarkConversationAsRead')
  async markConversationAsRead(
    dto: MarkConversationAsReadReq,
  ): Promise<MarkConversationAsReadRes> {
    return await this.appService.markConversationAsRead(dto);
  }

  @GrpcMethod('ChatService', 'GetUnreadCount')
  async getUnreadCount(dto: GetUnreadCountReq): Promise<GetUnreadCountRes> {
    return await this.appService.getUnreadCount(dto);
  }

  @GrpcMethod('ChatService', 'UploadFile')
  async uploadFile(dto: UploadFileReq): Promise<UploadFileRes> {
    return await this.appService.uploadFile(dto);
  }

  @GrpcMethod('ChatService', 'GetFile')
  async getFile(dto: GetFileReq): Promise<GetFileRes> {
    return await this.appService.getFile(dto);
  }
}
