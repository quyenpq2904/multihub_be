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

@Entity('reaction')
export class ReactionEntity extends AbstractEntity {
  constructor(data?: Partial<ReactionEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_reaction_id',
  })
  id!: Uuid;

  @Index() // Load reactions for a message
  @Column({
    name: 'message_id',
    type: 'uuid',
  })
  messageId: Uuid;

  @JoinColumn({
    name: 'message_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_reaction_message',
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
    foreignKeyConstraintName: 'FK_reaction_user',
  })
  @ManyToOne(() => UserEntity)
  user!: Relation<UserEntity>;

  @Column()
  reaction!: string;
}
