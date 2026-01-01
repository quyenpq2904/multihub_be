import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { AbstractEntity, Uuid } from '@multihub/shared-common';
import { ParticipantEntity } from './participant.entity';

@Entity('user')
export class UserEntity extends AbstractEntity {
  constructor(data?: Partial<UserEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryColumn('uuid', {
    primaryKeyConstraintName: 'PK_user_id',
  })
  id!: Uuid;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ default: '' })
  avatar?: string;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @OneToMany(() => ParticipantEntity, (participant) => participant.user)
  participants!: ParticipantEntity[];
}
