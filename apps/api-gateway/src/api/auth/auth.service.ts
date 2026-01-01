import {
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { JwtPayloadType } from '@multihub/shared-common';
import { lastValueFrom } from 'rxjs';
import { AuthServiceGrpc } from './auth.controller';

@Injectable()
export class AuthService implements OnModuleInit {
  private authService: AuthServiceGrpc;

  constructor(@Inject('AUTH_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceGrpc>('AuthService');
  }

  async verifyAccessToken(token: string): Promise<JwtPayloadType> {
    try {
      return await lastValueFrom(this.authService.verifyAccessToken({ token }));
    } catch {
      throw new UnauthorizedException();
    }
  }
}
