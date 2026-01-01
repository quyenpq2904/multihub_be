import { Uuid } from '@multihub/shared-common';

export class UserCreatedEvent {
  constructor(
    public readonly userId: Uuid,
    public readonly email: string,
    public readonly fullName: string,
    public readonly avatar?: string,
  ) {}
}
