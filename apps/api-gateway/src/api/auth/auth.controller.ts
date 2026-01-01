import { Body, Controller, Inject, OnModuleInit, Post } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import {
  LoginReq,
  LoginRes,
  RegisterReq,
  RegisterRes,
  RefreshReq,
  RefreshRes,
} from '@multihub/shared-dtos';
import { RegisterReqDto, RegisterResDto } from './dtos/register.dto';
import { LoginReqDto, LoginResDto } from './dtos/login.dto';
import { RefreshReqDto, RefreshResDto } from './dtos/refresh.dto';
import { ApiPublic } from '../../decorators/http-decorators';
import { ApiTags } from '@nestjs/swagger';
import { JwtPayloadType } from '@multihub/shared-common';

export interface AuthServiceGrpc {
  register(data: RegisterReq): Observable<RegisterRes>;
  signIn(data: LoginReq): Observable<LoginRes>;
  refreshToken(data: RefreshReq): Observable<RefreshRes>;
  verifyAccessToken(data: { token: string }): Observable<JwtPayloadType>;
}

@Controller('auth')
@ApiTags('auth')
export class AuthController implements OnModuleInit {
  private authService: AuthServiceGrpc;

  constructor(@Inject('AUTH_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceGrpc>('AuthService');
  }

  @Post('register')
  @ApiPublic({
    type: RegisterResDto,
    summary: 'Register',
  })
  async register(@Body() registerDto: RegisterReqDto): Promise<RegisterResDto> {
    return await lastValueFrom(this.authService.register(registerDto));
  }

  @Post('login')
  @ApiPublic({
    type: LoginResDto,
    summary: 'Sign in',
  })
  async signIn(@Body() loginDto: LoginReqDto): Promise<LoginResDto> {
    return await lastValueFrom(this.authService.signIn(loginDto));
  }

  @ApiPublic({
    type: RefreshResDto,
    summary: 'Refresh token',
  })
  @Post('refresh')
  async refresh(@Body() dto: RefreshReqDto): Promise<RefreshResDto> {
    return await lastValueFrom(this.authService.refreshToken(dto));
  }
}
