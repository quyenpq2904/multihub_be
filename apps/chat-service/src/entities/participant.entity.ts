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
import { UserEntity } from './user.entity';

export enum ParticipantRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

@Entity('participant')
@Index(['userId', 'conversationId']) // List user's conversations
export class ParticipantEntity extends AbstractEntity {
  constructor(data?: Partial<ParticipantEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_participant_id',
  })
  id!: Uuid;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.MEMBER,
  })
  role!: ParticipantRole;

  @Column({ name: 'last_read_message_id', nullable: true })
  lastReadMessageId?: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: Uuid;

  @ManyToOne(() => UserEntity, (user) => user.participants)
  @JoinColumn({ name: 'user_id' })
  user: Relation<UserEntity>;

  @Column({
    name: 'conversation_id',
    type: 'uuid',
  })
  conversationId: Uuid;

  @JoinColumn({
    name: 'conversation_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_participant_conversation',
  })
  @ManyToOne(
    () => ConversationEntity,
    (conversation) => conversation.participants,
  )
  conversation!: Relation<ConversationEntity>;

  @Column({
    name: 'joined_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  joinedAt!: Date;

  @Column({
    name: 'is_mute',
    default: false,
  })
  isMute!: boolean;
}
