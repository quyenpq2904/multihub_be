import { Controller, Get, Inject, OnModuleInit, Query } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '../../decorators/http-decorators';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtPayloadType } from '@multihub/shared-common';
import {
  GetMeReq,
  SearchUserReq,
  SearchUserRes,
  UserDto,
} from '@multihub/shared-dtos';
import { lastValueFrom, Observable } from 'rxjs';
import { UserResDto } from './dtos/user.res.dto';
import { SearchUserReqDto } from './dtos/search-user.req.dto';
import { SearchUserResDto } from './dtos/search-user.res.dto';

interface AuthServiceGrpc {
  getMe(data: GetMeReq): Observable<UserDto>;
  searchUser(data: SearchUserReq): Observable<SearchUserRes>;
}

@Controller('users')
@ApiTags('users')
export class UsersController implements OnModuleInit {
  private authService: AuthServiceGrpc;

  constructor(@Inject('AUTH_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceGrpc>('AuthService');
  }

  @Get('me')
  @ApiAuth({
    type: UserResDto,
    summary: 'Get current user profile',
  })
  async getMe(@CurrentUser() user: JwtPayloadType): Promise<UserResDto> {
    return await lastValueFrom(this.authService.getMe({ userId: user.id }));
  }

  @Get()
  @ApiAuth({
    type: SearchUserResDto,
    summary: 'Search users',
  })
  async searchUser(
    @Query() query: SearchUserReqDto,
    @CurrentUser() user: JwtPayloadType,
  ): Promise<SearchUserResDto> {
    const result = await lastValueFrom(
      this.authService.searchUser({
        ...query,
        offset: query.offset,
        excludedUserId: user.id,
      }),
    );
    return new SearchUserResDto(result.data, result.pagination);
  }
}
