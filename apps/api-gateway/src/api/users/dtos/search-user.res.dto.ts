import { OffsetPaginatedDto } from '@multihub/shared-common';
import { UserResDto } from './user.res.dto';
import { Type } from 'class-transformer';

export class SearchUserResDto extends OffsetPaginatedDto<UserResDto> {
  @Type(() => UserResDto)
  override data: UserResDto[];
}
