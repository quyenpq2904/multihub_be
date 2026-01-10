import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
  Param,
  Query,
  Patch,
  UseInterceptors,
  UploadedFile,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { ClientGrpc } from '@nestjs/microservices';
import {
  CreateConversationReq,
  CreateConversationRes,
  GetConversationsReq,
  GetConversationsRes,
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
  UploadFileReq,
  UploadFileRes,
  PinMessageReq,
  PinMessageRes,
  UnpinMessageReq,
  UnpinMessageRes,
  GetPinnedMessagesReq,
  GetPinnedMessagesRes,
} from '@multihub/shared-dtos';
import { lastValueFrom, Observable } from 'rxjs';
import {
  CreateConversationReqDto,
  CreateConversationResDto,
} from './dtos/create-conversation.dto';
import { JwtPayloadType, Uuid } from '@multihub/shared-common';
import {
  PinMessageResDto,
  UnpinMessageResDto,
  GetPinnedMessagesResDto,
} from './dtos/pin-message.dto';
import {
  GetConversationsReqDto,
  GetConversationsListResDto,
} from './dtos/get-conversations.dto';
import { ApiAuth } from '../../decorators/http-decorators';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import {
  AddMemberReqDto,
  RemoveMemberReqDto,
  AddMemberResDto,
  RemoveMemberResDto,
} from './dtos/manage-member.dto';
import { UpdateConversationReqDto } from './dtos/update-conversation.dto';
import {
  GetMessagesReqDto,
  GetMessagesResDto,
  MarkMessageAsReadResDto,
} from './dtos/get-messages.dto';

interface ChatServiceGrpc {
  createConversation(
    req: CreateConversationReq,
  ): Observable<CreateConversationRes>;
  getConversations(req: GetConversationsReq): Observable<GetConversationsRes>;
  addMember(req: AddMemberReq): Observable<AddMemberRes>;
  removeMember(req: RemoveMemberReq): Observable<RemoveMemberRes>;
  updateConversation(
    req: UpdateConversationReq,
  ): Observable<UpdateConversationRes>;
  getMessages(req: GetMessagesReq): Observable<GetMessagesRes>;
  markMessageAsRead(
    req: MarkMessageAsReadReq,
  ): Observable<MarkMessageAsReadRes>;
  uploadFile(req: UploadFileReq): Observable<UploadFileRes>;
  pinMessage(req: PinMessageReq): Observable<PinMessageRes>;
  unpinMessage(req: UnpinMessageReq): Observable<UnpinMessageRes>;
  getPinnedMessages(
    req: GetPinnedMessagesReq,
  ): Observable<GetPinnedMessagesRes>;
}

@Controller('chats')
@ApiTags('chats')
export class ChatController implements OnModuleInit {
  private chatService: ChatServiceGrpc;

  constructor(@Inject('CHAT_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.chatService = this.client.getService<ChatServiceGrpc>('ChatService');
  }

  @Post('/')
  @ApiAuth({
    type: CreateConversationResDto,
    summary: 'Create conversation',
  })
  async createConversation(
    @Body() dto: CreateConversationReqDto,
    @CurrentUser() jwtPayload: JwtPayloadType,
  ): Promise<CreateConversationResDto> {
    return await lastValueFrom(
      this.chatService.createConversation({ ...dto, createrId: jwtPayload.id }),
    );
  }

  @Get('/')
  @ApiAuth({
    type: GetConversationsListResDto,
    summary: 'Get all conversations',
  })
  async getAllChats(
    @CurrentUser() jwtPayload: JwtPayloadType,
    @Query() dto: GetConversationsReqDto,
  ): Promise<GetConversationsListResDto> {
    const result = await lastValueFrom(
      this.chatService.getConversations({
        userId: jwtPayload.id,
        limit: dto.limit || 20,
        afterCursor: dto.afterCursor,
        beforeCursor: dto.beforeCursor,
      }),
    );
    return result;
  }
  @Post('add-member')
  @ApiAuth({
    type: AddMemberResDto,
    summary: 'Add member to group',
  })
  async addMember(
    @Body() dto: AddMemberReqDto,
    @CurrentUser() jwtPayload: JwtPayloadType,
  ): Promise<AddMemberResDto> {
    return await lastValueFrom(
      this.chatService.addMember({ ...dto, userId: jwtPayload.id }),
    );
  }

  @Post('remove-member')
  @ApiAuth({
    type: RemoveMemberResDto,
    summary: 'Remove member from group',
  })
  async removeMember(
    @Body() dto: RemoveMemberReqDto,
    @CurrentUser() jwtPayload: JwtPayloadType,
  ): Promise<RemoveMemberResDto> {
    return await lastValueFrom(
      this.chatService.removeMember({ ...dto, userId: jwtPayload.id }),
    );
  }

  @Patch('/')
  @ApiConsumes('multipart/form-data')
  @ApiAuth({
    type: UpdateConversationRes,
    summary: 'Update conversation',
  })
  @UseInterceptors(FileInterceptor('avatar'))
  async updateConversation(
    @Body() dto: UpdateConversationReqDto,
    @CurrentUser() jwtPayload: JwtPayloadType,
    @UploadedFile() file: any,
  ): Promise<UpdateConversationRes> {
    let avatar = dto.avatar;
    if (file) {
      const upload = await lastValueFrom(
        this.chatService.uploadFile({
          filename: file.originalname,
          userId: jwtPayload.id,
        }),
      );
      avatar = upload.url;
    }

    return await lastValueFrom(
      this.chatService.updateConversation({
        ...dto,
        avatar,
        userId: jwtPayload.id,
      }),
    );
  }

  @Get(':conversationId/messages')
  @ApiAuth({
    type: GetMessagesResDto,
    summary: 'Get messages in conversation',
  })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query() dto: GetMessagesReqDto,
    @CurrentUser() jwtPayload: JwtPayloadType,
  ): Promise<GetMessagesResDto> {
    const result = await lastValueFrom(
      this.chatService.getMessages({
        conversationId: conversationId as Uuid,
        userId: jwtPayload.id,
        limit: dto.limit || 20,
        afterCursor: dto.afterCursor,
        beforeCursor: dto.beforeCursor,
      }),
    );
    return result;
  }

  @Post(':conversationId/messages/:messageId/read')
  @ApiAuth({
    type: MarkMessageAsReadResDto,
    summary: 'Mark message as read',
  })
  async markMessageAsRead(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() jwtPayload: JwtPayloadType,
  ): Promise<MarkMessageAsReadResDto> {
    return await lastValueFrom(
      this.chatService.markMessageAsRead({
        conversationId: conversationId as Uuid,
        messageId: messageId as Uuid,
        userId: jwtPayload.id,
      }),
    );
  }

  @Post(':conversationId/messages/:messageId/pin')
  @ApiAuth({
    type: PinMessageResDto,
    summary: 'Pin message',
  })
  async pinMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() jwtPayload: JwtPayloadType,
  ): Promise<PinMessageResDto> {
    return await lastValueFrom(
      this.chatService.pinMessage({
        conversationId: conversationId as Uuid,
        messageId: messageId as Uuid,
        userId: jwtPayload.id,
      }),
    );
  }

  @Delete(':conversationId/messages/:messageId/pin')
  @ApiAuth({
    type: UnpinMessageResDto,
    summary: 'Unpin message',
  })
  async unpinMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() jwtPayload: JwtPayloadType,
  ): Promise<UnpinMessageResDto> {
    return await lastValueFrom(
      this.chatService.unpinMessage({
        conversationId: conversationId as Uuid,
        messageId: messageId as Uuid,
        userId: jwtPayload.id,
      }),
    );
  }

  @Get(':conversationId/pinned-messages')
  @ApiAuth({
    type: GetPinnedMessagesResDto,
    summary: 'Get pinned messages',
  })
  async getPinnedMessages(
    @Param('conversationId') conversationId: string,
  ): Promise<GetPinnedMessagesResDto> {
    return await lastValueFrom(
      this.chatService.getPinnedMessages({
        conversationId: conversationId as Uuid,
      }),
    );
  }
}
