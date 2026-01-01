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
import { MessageEntity } from './message.entity';
import { UserEntity } from './user.entity';

@Entity('message_read')
@Index(['userId', 'messageId']) // Unread count query
export class MessageReadEntity extends AbstractEntity {
  constructor(data?: Partial<MessageReadEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_message_read_id',
  })
  id!: Uuid;

  @Column({
    name: 'message_id',
    type: 'uuid',
  })
  messageId: Uuid;

  @JoinColumn({
    name: 'message_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_message_read_message',
  })
  @ManyToOne(() => MessageEntity)
  message!: Relation<MessageEntity>;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: Uuid;

  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_message_read_user',
  })
  @ManyToOne(() => UserEntity)
  user!: Relation<UserEntity>;

  @Column({
    name: 'read_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  readAt!: Date;
}
