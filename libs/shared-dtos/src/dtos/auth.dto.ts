import {
  EmailField,
  PasswordField,
  StringField,
  UUIDField,
  TokenField,
  DateField,
  OffsetPageOptionsDto,
  OffsetPaginatedDto,
  UUIDFieldOptional,
} from '@multihub/shared-common';
import { Type } from 'class-transformer';

export class LoginReq {
  @EmailField()
  email: string;

  @PasswordField()
  password: string;
}

export class LoginRes {
  @UUIDField()
  userId: string;
  @TokenField()
  accessToken: string;
  @TokenField()
  refreshToken: string;
}

export class RegisterReq {
  @EmailField()
  email: string;

  @PasswordField()
  password: string;

  @StringField()
  fullName: string;
}

export class RegisterRes {
  @UUIDField()
  userId: string;
}

export class GetMeReq {
  @UUIDField()
  userId: string;
}

export class RefreshReq {
  @TokenField()
  refreshToken: string;
}

export class RefreshRes {
  @TokenField()
  accessToken: string;
  @TokenField()
  refreshToken: string;
}

export class UserDto {
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

export class SearchUserReq extends OffsetPageOptionsDto {
  @UUIDFieldOptional()
  excludedUserId?: string;
}

export class SearchUserRes extends OffsetPaginatedDto<UserDto> {
  @Type(() => UserDto)
  override data: UserDto[];
}
