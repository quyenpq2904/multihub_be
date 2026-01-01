import process from 'node:process';
import { registerAs } from '@nestjs/config';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AppConfig } from './app-config.type';
import { validateConfig } from '@multihub/shared-common';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  APP_NAME: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  APP_PORT: number;

  @IsString()
  @IsNotEmpty()
  APP_DESCRIPTION: string;

  @IsString()
  @IsNotEmpty()
  CLIENT_URL: string;

  @IsString()
  @IsNotEmpty()
  AUTH_GRPC_URL: string;

  @IsString()
  @IsNotEmpty()
  CHAT_GRPC_URL: string;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsNotEmpty()
  REDIS_PORT: number;

  @IsString()
  @IsNotEmpty()
  REDIS_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  REDIS_PASSWORD: string;
}

export const appConfig = registerAs<AppConfig>('app', () => {
  console.info(`Register AppConfig from environment variables`);
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    name: process.env.APP_NAME || 'Multihub',
    port: process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 3000,
    description: process.env.APP_DESCRIPTION || 'Multihub API Gateway',
    clientUrl: process.env.CLIENT_URL!,
    authGrpcUrl: process.env.AUTH_GRPC_URL!,
    chatGrpcUrl: process.env.CHAT_GRPC_URL!,
    redisHost: process.env.REDIS_HOST!,
    redisPort: parseInt(process.env.REDIS_PORT, 10),
    redisUsername: process.env.REDIS_USERNAME!,
    redisPassword: process.env.REDIS_PASSWORD!,
  };
});
