import process from 'node:process';
import { registerAs } from '@nestjs/config';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AppConfig } from './app-config.type';
import { IsMs, validateConfig } from '@multihub/shared-common';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  KAFKA_BROKER: string;

  @IsString()
  @IsOptional()
  GRPC_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  @IsMs()
  JWT_TOKEN_EXPIRES_IN: string;

  @IsString()
  @IsNotEmpty()
  REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  @IsMs()
  REFRESH_TOKEN_EXPIRES_IN: string;
}

export const appConfig = registerAs<AppConfig>('app', () => {
  console.info(`Register AppConfig from environment variables`);
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    kafkaBroker: process.env.KAFKA_BROKER!,
    grpcUrl: process.env.GRPC_URL!,
    secret: process.env.JWT_SECRET!,
    expires: process.env.JWT_TOKEN_EXPIRES_IN!,
    refreshSecret: process.env.REFRESH_SECRET!,
    refreshExpires: process.env.REFRESH_TOKEN_EXPIRES_IN!,
  };
});
