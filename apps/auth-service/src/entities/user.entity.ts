import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SessionEntity } from './session.entity';
import { hashPassword } from '../utils/password.util';
import { AbstractEntity, Uuid } from '@multihub/shared-common';

@Entity('user')
export class UserEntity extends AbstractEntity {
  constructor(data?: Partial<UserEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_user_id' })
  id!: Uuid;

  @Column()
  @Index('UQ_user_email', { unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    name: 'full_name',
  })
  fullName!: string;

  @Column({ nullable: true, default: '' })
  avatar?: string;

  @OneToMany(() => SessionEntity, (session) => session.user)
  sessions?: SessionEntity[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await hashPassword(this.password);
    }
  }
}
