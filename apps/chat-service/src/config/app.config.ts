import process from 'node:process';
import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import { AppConfig } from './app-config.type';
import { validateConfig } from '@multihub/shared-common';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  KAFKA_BROKER: string;

  @IsString()
  @IsOptional()
  GRPC_URL: string;
}

export const appConfig = registerAs<AppConfig>('app', () => {
  console.info(`Register AppConfig from environment variables`);
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    kafkaBroker: process.env.KAFKA_BROKER!,
    grpcUrl: process.env.GRPC_URL!,
  };
});
