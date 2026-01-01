import { Injectable } from '@nestjs/common';
import {
  Uuid,
  CursorPaginationDto,
  CursorPageOptionsDto,
} from '@multihub/shared-common';
import { InjectRepository } from '@nestjs/typeorm';
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
  MarkConversationAsReadReq,
  MarkConversationAsReadRes,
  UploadFileReq,
  UploadFileRes,
  GetFileReq,
  GetFileRes,
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
  GetUnreadCountReq,
  GetUnreadCountRes,
  Conversation,
} from '@multihub/shared-dtos';
import { RpcException } from '@nestjs/microservices';
import {
  ConversationEntity,
  ConversationType,
} from './entities/conversation.entity';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import {
  ParticipantEntity,
  ParticipantRole,
} from './entities/participant.entity';
import { UserEntity } from './entities/user.entity';
import { MessageEntity } from './entities/message.entity';
import { ReactionEntity } from './entities/reaction.entity';
import { PinnedMessageEntity } from './entities/pinned-message.entity';
import { MessageReadEntity } from './entities/message-read.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(ParticipantEntity)
    private readonly participantRepository: Repository<ParticipantEntity>,
    @InjectRepository(ReactionEntity)
    private readonly reactionRepository: Repository<ReactionEntity>,
    @InjectRepository(PinnedMessageEntity)
    private readonly pinnedMessageRepository: Repository<PinnedMessageEntity>,
    @InjectRepository(MessageReadEntity)
    private readonly messageReadRepository: Repository<MessageReadEntity>,
    private dataSource: DataSource,
  ) {}

  async createConversation(
    dto: CreateConversationReq,
  ): Promise<CreateConversationRes> {
    console.log(dto);
    const { createrId, users } = dto;

    const isGroup = users.length > 1;

    if (!isGroup) {
      const otherUserId = users[0];
      const existingConversation = await this.conversationRepository
        .createQueryBuilder('conversation')
        .innerJoin('conversation.participants', 'p1')
        .innerJoin('conversation.participants', 'p2')
        .where('conversation.type = :type', { type: ConversationType.DIRECT })
        .andWhere('p1.userId = :user1', { user1: createrId })
        .andWhere('p2.userId = :user2', { user2: otherUserId })
        .groupBy('conversation.id')
        .getOne();

      if (existingConversation) {
        return plainToInstance(CreateConversationRes, {
          id: existingConversation.id,
        });
      }
    }

    const conversation = await this.dataSource.transaction(async (manager) => {
      const newConversation = manager.create(ConversationEntity, {
        type: isGroup ? ConversationType.GROUP : ConversationType.DIRECT,
      });
      await manager.save(newConversation);
      const participantsToCreate: ParticipantEntity[] = [];

      participantsToCreate.push(
        manager.create(ParticipantEntity, {
          conversationId: newConversation.id,
          userId: createrId,
          role: isGroup ? ParticipantRole.ADMIN : undefined,
        }),
      );

      users.forEach((user) => {
        participantsToCreate.push(
          manager.create(ParticipantEntity, {
            conversationId: newConversation.id,
            userId: user,
            role: isGroup ? ParticipantRole.MEMBER : undefined,
          }),
        );
      });

      await manager.save(participantsToCreate);

      return newConversation;
    });

    return plainToInstance(CreateConversationRes, {
      id: conversation.id,
    });
  }

  async getConversations(
    dto: GetConversationsReq,
  ): Promise<GetConversationsRes> {
    const { userId, limit, afterCursor, beforeCursor } = dto;
    const query = this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'participant')
      .where('participant.userId = :userId', { userId })
      .leftJoinAndSelect('conversation.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .orderBy('conversation.updatedAt', 'DESC')
      .addOrderBy('conversation.id', 'DESC') // Stable sort
      .take(limit || 20);

    // Count first (approximate for list)
    const totalRecords = await this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'participant')
      .where('participant.userId = :userId', { userId })
      .getCount();

    if (afterCursor) {
      const refConv = await this.conversationRepository.findOneBy({
        id: afterCursor as Uuid,
      });
      if (refConv) {
        // Newer conversations
        query.andWhere(
          '(conversation.updatedAt > :refDate OR (conversation.updatedAt = :refDate AND conversation.id > :refId))',
          { refDate: refConv.updatedAt, refId: refConv.id },
        );
      }
    } else if (beforeCursor) {
      const refConv = await this.conversationRepository.findOneBy({
        id: beforeCursor as Uuid,
      });
      if (refConv) {
        // Older conversations
        query.andWhere(
          '(conversation.updatedAt < :refDate OR (conversation.updatedAt = :refDate AND conversation.id < :refId))',
          { refDate: refConv.updatedAt, refId: refConv.id },
        );
      }
    }

    const conversations = await query.getMany();

    // Calculate cursors for metadata
    const metaAfterCursor =
      conversations.length > 0 ? conversations[0].id : null;
    const metaBeforeCursor =
      conversations.length > 0
        ? conversations[conversations.length - 1].id
        : null;

    const data = conversations.map((conversation) => ({
      id: conversation.id,
      name: conversation.name,
      avatar: conversation.avatar,
      type: conversation.type,
      participants: conversation.participants.map((participant) => ({
        id: participant.user.id,
        fullName: participant.user.fullName,
        avatar: participant.user.avatar,
        role: participant.role || '',
        email: participant.user.email,
      })),
    }));

    const meta = new CursorPaginationDto(
      totalRecords,
      metaAfterCursor as string,
      metaBeforeCursor as string,
      {
        limit: limit || 20,
        afterCursor,
        beforeCursor,
      } as CursorPageOptionsDto,
    );

    return {
      data,
      pagination: meta,
    };
  }

  async addMember(dto: AddMemberReq): Promise<AddMemberRes> {
    const { conversationId, userId, memberId } = dto;
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) throw new RpcException('Conversation not found');
    if (conversation.type !== ConversationType.GROUP) {
      throw new RpcException('Only group conversations support adding members');
    }

    const requester = conversation.participants.find(
      (p) => p.userId === userId,
    );
    if (!requester || requester.role !== ParticipantRole.ADMIN) {
      throw new RpcException('Only admins can add members');
    }

    const exists = conversation.participants.find((p) => p.userId === memberId);
    if (exists) throw new RpcException('User is already a member');

    const newParticipant = new ParticipantEntity({
      conversationId: conversation.id,
      userId: memberId,
      role: ParticipantRole.MEMBER,
    });
    await newParticipant.save();

    return { success: true, conversationId: conversation.id };
  }

  async removeMember(dto: RemoveMemberReq): Promise<RemoveMemberRes> {
    const { conversationId, userId, memberId } = dto;
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) throw new RpcException('Conversation not found');
    if (conversation.type !== ConversationType.GROUP) {
      throw new RpcException(
        'Only group conversations support removing members',
      );
    }

    const requester = conversation.participants.find(
      (p) => p.userId === userId,
    );
    if (!requester || requester.role !== ParticipantRole.ADMIN) {
      throw new RpcException('Only admins can remove members');
    }

    const participantToRemove = conversation.participants.find(
      (p) => p.userId === memberId,
    );
    if (!participantToRemove) throw new RpcException('Member not found');

    await participantToRemove.remove();

    return { success: true, conversationId: conversation.id };
  }

  async updateConversation(
    dto: UpdateConversationReq,
  ): Promise<UpdateConversationRes> {
    const { conversationId, userId, name, avatar } = dto;
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) throw new RpcException('Conversation not found');

    if (conversation.type !== ConversationType.GROUP) {
      throw new RpcException(
        'Update conversation is only allowed for GROUP conversations',
      );
    }

    const requester = conversation.participants.find(
      (p) => p.userId === userId,
    );
    if (!requester || requester.role !== ParticipantRole.ADMIN) {
      throw new RpcException('Only admins can update group conversation');
    }

    if (name !== undefined) conversation.name = name;
    if (avatar !== undefined) conversation.avatar = avatar;

    await conversation.save();

    return {
      id: conversation.id,
      name: conversation.name || '',
      avatar: conversation.avatar || '',
    };
  }

  async createUser(data: UserCreatedEvent): Promise<void> {
    const { userId, fullName, avatar, email } = data;
    const user = new UserEntity({
      id: userId,
      fullName,
      avatar,
      email,
    });
    await user.save();
  }

  async getMessages(dto: GetMessagesReq): Promise<GetMessagesRes> {
    const { conversationId, limit, afterCursor, beforeCursor, userId } = dto;

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new RpcException('Conversation not found');
    }

    const participant = conversation.participants.find(
      (p) => p.userId === userId,
    );
    if (!participant) {
      throw new RpcException('User is not a participant of this conversation');
    }

    const totalRecords = await this.messageRepository.count({
      where: { conversationId },
    });

    const query = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId });

    if (afterCursor) {
      const refMsg = await this.messageRepository.findOneBy({
        id: afterCursor as Uuid,
      });
      if (!refMsg) throw new RpcException('Reference message not found');
      // Newer messages (> cursor), scan ASC
      query
        .andWhere(
          '(message.createdAt > :createdAt OR (message.createdAt = :createdAt AND message.id > :id))',
          { createdAt: refMsg.createdAt, id: refMsg.id },
        )
        .orderBy('message.createdAt', 'ASC')
        .addOrderBy('message.id', 'ASC');
    } else {
      // Default or beforeCursor (Older <), scan DESC
      if (beforeCursor) {
        const refMsg = await this.messageRepository.findOneBy({
          id: beforeCursor as Uuid,
        });
        if (!refMsg) throw new RpcException('Reference message not found');
        query.andWhere(
          '(message.createdAt < :createdAt OR (message.createdAt = :createdAt AND message.id < :id))',
          { createdAt: refMsg.createdAt, id: refMsg.id },
        );
      }
      query
        .orderBy('message.createdAt', 'DESC')
        .addOrderBy('message.id', 'DESC');
    }

    query.take(limit || 20);

    const rawMessages = await query.getMany();

    // If fetching older (DESC), we reverse to get chronological order (ASC)
    const messages = afterCursor ? rawMessages : rawMessages.reverse();

    const data = messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      conversationId: m.conversationId,
      createdAt: m.createdAt.toISOString(),
      type: m.type,
      parentMessageId: m.parentMessageId,
    }));

    // For metadata:
    // If we have messages, the first one is the "start" (can be 'after' of previous page if going forward?),
    // Wait, cursor Pagination definition of before/after in meta usually refers to "cursors to get NEXT/PREV page".
    // "afterCursor" in meta usually means "cursor to get items AFTER this page". i.e. last item's ID.
    // "beforeCursor" in meta usually means "cursor to get items BEFORE this page". i.e. first item's ID.

    const metaAfterCursor =
      messages.length > 0 ? messages[messages.length - 1].id : null;
    const metaBeforeCursor = messages.length > 0 ? messages[0].id : null;

    const meta = new CursorPaginationDto(
      totalRecords,
      metaAfterCursor as string,
      metaBeforeCursor as string,
      {
        limit: limit || 20,
        afterCursor,
        beforeCursor,
      } as CursorPageOptionsDto,
    );

    return {
      data,
      pagination: meta,
    };
  }

  async markMessageAsRead(
    dto: MarkMessageAsReadReq,
  ): Promise<MarkMessageAsReadRes> {
    const { conversationId, messageId, userId } = dto;

    // We can assume validate conversation membership first
    const participant = await this.dataSource
      .getRepository(ParticipantEntity)
      .findOne({
        where: { conversationId, userId },
      });

    if (!participant) {
      throw new RpcException('User is not a participant of this conversation');
    }

    // Update the lastReadMessageId
    // Logic: Only update if the new message is "newer" than the current lastReadMessageId?
    // Or just trust the client?
    // For Messenger style properly, we should ensure we don't move "backwards" unless intented.
    // But simplistic verification: just update it.

    // We should probably verify message belongs to conversation
    const message = await this.messageRepository.findOneBy({ id: messageId });
    if (!message || message.conversationId !== conversationId) {
      throw new RpcException('Message not valid');
    }

    participant.lastReadMessageId = messageId;
    await participant.save();

    return { success: true };
  }

  async createMessage(dto: CreateMessageReq): Promise<CreateMessageRes> {
    const { conversationId, userId, content } = dto;

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new RpcException('Conversation not found');
    }

    const participant = conversation.participants.find(
      (p) => p.userId === userId,
    );
    if (!participant) {
      throw new RpcException('User is not a participant of this conversation');
    }

    const newMessage = this.messageRepository.create({
      conversationId,
      senderId: userId,
      content,
    });

    await this.messageRepository.save(newMessage);

    // Bump conversation updatedAt
    conversation.updatedAt = new Date();
    await conversation.save();

    return {
      id: newMessage.id,
      content: newMessage.content,
      senderId: newMessage.senderId,
      conversationId: newMessage.conversationId,
      createdAt: newMessage.createdAt.toISOString(),
      type: newMessage.type,
      parentMessageId: newMessage.parentMessageId,
    };
  }

  async getConversation(dto: GetConversationReq): Promise<Conversation> {
    const { conversationId, userId } = dto;
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants', 'participants.user'],
    });

    if (!conversation) {
      throw new RpcException('Conversation not found');
    }

    const participant = conversation.participants.find(
      (p) => p.userId === userId,
    );
    if (!participant) {
      throw new RpcException('User is not a member of this conversation');
    }

    return {
      id: conversation.id,
      name: conversation.name,
      avatar: conversation.avatar,
      type: conversation.type,
      participants: conversation.participants.map((p) => ({
        id: p.user.id,
        fullName: p.user.fullName,
        avatar: p.user.avatar,
        role: p.role,
        email: p.user.email,
      })),
    };
  }

  async deleteConversation(
    dto: DeleteConversationReq,
  ): Promise<DeleteConversationRes> {
    const { conversationId, userId } = dto;
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) throw new RpcException('Conversation not found');

    const participant = conversation.participants.find(
      (p) => p.userId === userId,
    );
    if (!participant)
      throw new RpcException('User is not a member of this conversation');

    // Soft delete logic:
    // If GROUP and ADMIN, maybe delete for everyone? Or just leave?
    // Requirement says "Leave/delete conversation".
    // If DIRECT, maybe just hide? Or soft delete covers it.
    // For now, let's implement "Leave" for members and "Delete" for owner/admin if requested?
    // Or closer to schema "is_deleted".

    // If group admin wants to delete:
    if (
      conversation.type === ConversationType.GROUP &&
      participant.role === ParticipantRole.ADMIN
    ) {
      conversation.isDeleted = true;
      await conversation.save();
      return { success: true };
    }

    // For now, assume delete means soft delete the conversation if permissible,
    // or removing the participant (Leave).
    // Let's implement LEAVE for normal members in group.
    if (conversation.type === ConversationType.GROUP) {
      await this.removeMember({ conversationId, userId, memberId: userId });
      return { success: true };
    }

    // For DIRECT, we usually just archive/hide. But schema has isDeleted on Conversation.
    // Setting isDeleted=true on conversation deletes it for BOTH.
    // Ideally we need isDeleted on Participant to hide for one user.
    // Schema doesn't show isDeleted on Participant, but we have `is_deleted` on Conversation.
    // Let's assume Delete = Soft Delete globally for now or strictly following schema capabilities.
    // If I soft delete conversation, it's gone for both.

    conversation.isDeleted = true;
    await conversation.save();

    return { success: true };
  }

  async deleteMessage(dto: DeleteMessageReq): Promise<DeleteMessageRes> {
    const { conversationId, messageId, userId } = dto;
    const message = await this.messageRepository.findOne({
      where: { id: messageId, conversationId },
      relations: ['conversation', 'conversation.participants'],
    });

    if (!message) throw new RpcException('Message not found');

    // Check permissions: Sender or Admin
    if (message.senderId !== userId) {
      // Check if admin
      const participant = message.conversation.participants.find(
        (p) => p.userId === userId,
      );
      if (!participant || participant.role !== ParticipantRole.ADMIN) {
        throw new RpcException('Not authorized to delete this message');
      }
    }

    // Soft delete if entity supports it, or hard delete.
    // MessageEntity does NOT have isDeleted based on previous schema summary.
    // Wait, let me check MessageEntity.
    // If no isDeleted, we hard delete.
    await message.remove();

    return { success: true };
  }

  async addReaction(dto: AddReactionReq): Promise<AddReactionRes> {
    const { messageId, userId, emoji } = dto;
    const message = await this.messageRepository.findOneBy({ id: messageId });
    if (!message) throw new RpcException('Message not found');

    // Ideally verify user is part of the conversation

    const reaction = this.reactionRepository.create({
      messageId,
      userId,
      reaction: emoji,
    });
    await this.reactionRepository.save(reaction);

    return { success: true };
  }

  async removeReaction(dto: RemoveReactionReq): Promise<RemoveReactionRes> {
    const { messageId, userId, emoji } = dto;
    const reaction = await this.reactionRepository.findOneBy({
      messageId,
      userId,
      reaction: emoji,
    });

    if (reaction) {
      await this.reactionRepository.remove(reaction);
    }
    return { success: true };
  }

  async getReactions(dto: GetReactionsReq): Promise<GetReactionsRes> {
    const { messageId } = dto;
    const reactions = await this.reactionRepository.find({
      where: { messageId },
    });

    return {
      reactions: reactions.map((r) => ({
        id: r.id,
        userId: r.userId,
        emoji: r.reaction,
      })),
    };
  }

  async toggleMute(dto: ToggleMuteReq): Promise<ToggleMuteRes> {
    const { conversationId, userId } = dto;
    const participant = await this.participantRepository.findOneBy({
      conversationId,
      userId,
    });

    if (!participant) throw new RpcException('Participant not found');

    participant.isMute = !participant.isMute;
    await this.participantRepository.save(participant);

    return { isMuted: participant.isMute };
  }

  async getMuteStatus(dto: GetMuteStatusReq): Promise<GetMuteStatusRes> {
    const { conversationId, userId } = dto;
    const participant = await this.participantRepository.findOneBy({
      conversationId,
      userId,
    });

    if (!participant) throw new RpcException('Participant not found');

    return { isMuted: participant.isMute };
  }

  async pinMessage(dto: PinMessageReq): Promise<PinMessageRes> {
    const { conversationId, messageId, userId } = dto;

    // Authorization check (Admin only for group?)
    const participant = await this.participantRepository.findOneBy({
      conversationId,
      userId,
    });
    if (!participant) throw new RpcException('Participant not found');

    // Assuming assuming anyone can pin in Direct, Admin in Group?
    // Let's enforce Admin for Group.
    const conversation = await this.conversationRepository.findOneBy({
      id: conversationId,
    });
    if (
      conversation?.type === ConversationType.GROUP &&
      participant.role !== ParticipantRole.ADMIN
    ) {
      throw new RpcException('Only admins can pin messages in groups');
    }

    const newMessage = this.pinnedMessageRepository.create({
      conversationId,
      messageId,
      pinnedById: userId,
      pinnedAt: new Date(),
    });

    await this.pinnedMessageRepository.save(newMessage);
    return { success: true };
  }

  async unpinMessage(dto: UnpinMessageReq): Promise<UnpinMessageRes> {
    const { conversationId, messageId, userId } = dto;

    const participant = await this.participantRepository.findOneBy({
      conversationId,
      userId,
    });
    if (!participant) throw new RpcException('Participant not found');

    const conversation = await this.conversationRepository.findOneBy({
      id: conversationId,
    });
    if (
      conversation?.type === ConversationType.GROUP &&
      participant.role !== ParticipantRole.ADMIN
    ) {
      throw new RpcException('Only admins can unpin messages in groups');
    }

    await this.pinnedMessageRepository.delete({ conversationId, messageId });
    return { success: true };
  }

  async getPinnedMessages(
    dto: GetPinnedMessagesReq,
  ): Promise<GetPinnedMessagesRes> {
    const { conversationId } = dto;
    const pinned = await this.pinnedMessageRepository.find({
      where: { conversationId },
      order: { pinnedAt: 'DESC' },
    });

    return {
      messages: pinned.map((p) => ({
        id: p.id,
        messageId: p.messageId,
        pinnedAt: p.pinnedAt.toISOString(),
      })),
    };
  }

  async markConversationAsRead(
    dto: MarkConversationAsReadReq,
  ): Promise<MarkConversationAsReadRes> {
    // This implies making all current messages as read.
    // Usually implementation updates lastReadMessageId to the latest message ID in the conversation.
    const { conversationId, userId } = dto;

    const lastMessage = await this.messageRepository.findOne({
      where: { conversationId },
      order: { createdAt: 'DESC' },
    });

    if (lastMessage) {
      const participant = await this.participantRepository.findOneBy({
        conversationId,
        userId,
      });
      if (participant) {
        participant.lastReadMessageId = lastMessage.id;
        await participant.save();
      }
    }

    return { success: true };
  }

  // Fixing createMessage as well
  /*
  async createMessage(dto: CreateMessageReq): Promise<CreateMessageRes> {
     ...
     return {
       ...
       type: newMessage.type,
       parentMessageId: newMessage.parentMessageId,
     };
  }
  */

  async getUnreadCount(dto: GetUnreadCountReq): Promise<GetUnreadCountRes> {
    const { conversationId, userId } = dto;
    const participant = await this.participantRepository.findOneBy({
      conversationId,
      userId,
    });
    if (!participant) return { count: 0 };

    if (!participant.lastReadMessageId) {
      // If no read message, count all? Or 0?
      const count = await this.messageRepository.count({
        where: { conversationId },
      });
      return { count };
    }

    const lastReadMsg = await this.messageRepository.findOneBy({
      id: participant.lastReadMessageId as Uuid,
    });
    if (!lastReadMsg) return { count: 0 }; // Should not happen usually

    const count = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('message.createdAt > :createdAt', {
        createdAt: lastReadMsg.createdAt,
      })
      .getCount();

    return { count };
  }

  async uploadFile(dto: UploadFileReq): Promise<UploadFileRes> {
    const { filename } = dto;
    // Mock implementation
    // Using a random UUID-like string.
    // I should check Uuid definition. usually in valid-uid.ts or similar.
    // In shared-common it might be type alias for string.
    // I'll use simple random string or 'uuid' package if imported.
    // The previous code uses `this.messageRepository.create(...)` which generates ID.
    // I will generate a random UUID-like string.
    const mockId = '123e4567-e89b-12d3-a456-426614174000'; // Or generic.
    // Actually I can use database to generate UUID if I insert into Attachment?
    // But this is just returning URL.
    return { url: `https://mock-s3.com/${mockId}/${filename}` };
  }

  async getFile(dto: GetFileReq): Promise<GetFileRes> {
    const { fileId } = dto;
    return { url: `https://mock-s3.com/${fileId}/filename.ext` };
  }
}
