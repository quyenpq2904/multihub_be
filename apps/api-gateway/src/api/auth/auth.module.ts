import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService<AllConfigType>) => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: join(__dirname, 'protos/auth.proto'),
            url: configService.getOrThrow('app.authGrpcUrl', { infer: true }),
          },
        }),
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, ClientsModule],
})
export class AuthModule {}
