import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  RegisterReq,
  RegisterRes,
  LoginReq,
  LoginRes,
  RefreshReq,
  RefreshRes,
  SearchUserReq,
  SearchUserRes,
  UserDto,
} from '@multihub/shared-dtos';
import { JwtPayloadType } from '@multihub/shared-common';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @GrpcMethod('AuthService', 'Register')
  async register(data: RegisterReq): Promise<RegisterRes> {
    return await this.appService.register(data);
  }

  @GrpcMethod('AuthService', 'SignIn')
  async signIn(data: LoginReq): Promise<LoginRes> {
    return await this.appService.signIn(data);
  }

  @GrpcMethod('AuthService', 'VerifyAccessToken')
  verifyAccessToken(data: { token: string }): Promise<JwtPayloadType> {
    return this.appService.verifyAccessToken(data.token);
  }

  @GrpcMethod('AuthService', 'GetMe')
  async getMe(data: { userId: string }): Promise<UserDto> {
    return await this.appService.getMe(data);
  }

  @GrpcMethod('AuthService', 'RefreshToken')
  async refreshToken(data: RefreshReq): Promise<RefreshRes> {
    return await this.appService.refreshToken(data);
  }

  @GrpcMethod('AuthService', 'SearchUser')
  async searchUser(data: SearchUserReq): Promise<SearchUserRes> {
    return await this.appService.searchUser(data);
  }
}
