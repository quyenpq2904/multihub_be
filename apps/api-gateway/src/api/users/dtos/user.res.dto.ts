import {
  DateField,
  EmailField,
  StringField,
  UUIDField,
} from '@multihub/shared-common';

export class UserResDto {
  @UUIDField()
  id: string;

  @EmailField()
  email: string;

  @StringField()
  fullName: string;

  @StringField()
  avatar: string;

  @DateField()
  createdAt: string;

  @DateField()
  updatedAt: string;
}
