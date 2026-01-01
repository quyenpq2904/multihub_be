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

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  VIDEO = 'VIDEO',
}

@Entity('message')
@Index(['conversationId', 'createdAt']) // Pagination: WHERE conversation_id = ? ORDER BY created_at DESC
export class MessageEntity extends AbstractEntity {
  constructor(data?: Partial<MessageEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_message_id',
  })
  id!: Uuid;

  @Column()
  content!: string;

  @Index() // Filtering by message type
  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type!: MessageType;

  @Index() // Thread lookup
  @Column({ name: 'parent_message_id', nullable: true, type: 'uuid' })
  parentMessageId?: Uuid;

  @Index() // FK
  @Column({
    name: 'conversation_id',
    type: 'uuid',
  })
  conversationId: Uuid;

  @Column({
    name: 'sender_id',
    type: 'uuid',
  })
  senderId: Uuid;

  @JoinColumn({
    name: 'conversation_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_message_conversation',
  })
  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages)
  conversation!: Relation<ConversationEntity>;
}
