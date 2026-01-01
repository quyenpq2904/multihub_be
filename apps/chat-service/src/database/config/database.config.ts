import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { DatabaseConfig } from './database-config.type';
import { validateConfig } from '@multihub/shared-common';

class EnvironmentVariablesValidator {
  @IsString()
  DATABASE_TYPE: string;

  @IsString()
  DATABASE_HOST: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  DATABASE_PORT: number;

  @IsString()
  DATABASE_USERNAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  @IsOptional()
  DATABASE_NAME?: string;

  @IsBoolean()
  @IsOptional()
  DATABASE_SYNCHRONIZE?: boolean;
}

export const databaseConfig = registerAs<DatabaseConfig>('database', () => {
  console.log('Register DatabaseConfig from environment variables');
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    type: process.env.DATABASE_TYPE!,
    host: process.env.DATABASE_HOST!,
    port: process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT, 10)
      : 5432,
    name: process.env.DATABASE_NAME || 'chat_db',
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  };
});
