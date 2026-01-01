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

@Entity('attachment')
export class AttachmentEntity extends AbstractEntity {
  constructor(data?: Partial<AttachmentEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_attachment_id',
  })
  id!: Uuid;

  @Index() // Load attachments for a message
  @Column({
    name: 'message_id',
    type: 'uuid',
  })
  messageId: Uuid;

  @JoinColumn({
    name: 'message_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_attachment_message',
  })
  @ManyToOne(() => MessageEntity)
  message!: Relation<MessageEntity>;

  @Column()
  url!: string;

  @Column()
  type!: string;

  @Column({ type: 'int', nullable: true })
  size?: number;
}
