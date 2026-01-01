import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, ChatModule, UsersModule],
})
export class ApiModule {}
