import { AbstractEntity, Uuid } from '@multihub/shared-common';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ConversationEntity } from './conversation.entity';
import { MessageEntity } from './message.entity';
import { UserEntity } from './user.entity';

@Entity('pinned_message')
export class PinnedMessageEntity extends AbstractEntity {
  constructor(data?: Partial<PinnedMessageEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_pinned_message_id',
  })
  id!: Uuid;

  @Index() // List pinned messages in conversation
  @Column({
    name: 'conversation_id',
    type: 'uuid',
  })
  conversationId: Uuid;

  @JoinColumn({
    name: 'conversation_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_pinned_message_conversation',
  })
  @ManyToOne(() => ConversationEntity)
  conversation!: Relation<ConversationEntity>;

  @Column({
    name: 'message_id',
    type: 'uuid',
  })
  messageId: Uuid;

  @JoinColumn({
    name: 'message_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_pinned_message_message',
  })
  @ManyToOne(() => MessageEntity)
  message!: Relation<MessageEntity>;

  @Column({
    name: 'pinned_by',
    type: 'uuid',
  })
  pinnedById: Uuid;

  @JoinColumn({
    name: 'pinned_by',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_pinned_message_pinned_by',
  })
  @ManyToOne(() => UserEntity)
  pinnedBy!: Relation<UserEntity>;

  @Column({
    name: 'pinned_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  pinnedAt!: Date;
}
