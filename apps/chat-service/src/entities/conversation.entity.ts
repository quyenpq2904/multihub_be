import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractEntity, Uuid } from '@multihub/shared-common';
import { ParticipantEntity } from './participant.entity';
import { MessageEntity } from './message.entity';

export enum ConversationType {
  GROUP = 'GROUP',
  DIRECT = 'DIRECT',
}

@Entity('conversation')
export class ConversationEntity extends AbstractEntity {
  constructor(data?: Partial<ConversationEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_conversation_id',
  })
  id!: Uuid;

  @Column({
    nullable: true,
    default: '',
  })
  name?: string;

  @Column({
    nullable: true,
    default: '',
  })
  avatar?: string;

  @Column({ default: ConversationType.DIRECT })
  type!: ConversationType;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @OneToMany(() => ParticipantEntity, (participant) => participant.conversation)
  participants!: ParticipantEntity[];

  @OneToMany(() => MessageEntity, (message) => message.conversation)
  messages!: MessageEntity[];
}
