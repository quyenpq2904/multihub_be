import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { ParticipantEntity } from './entities/participant.entity';
import { MessageEntity } from './entities/message.entity';
import { UserEntity } from './entities/user.entity';
import { ReactionEntity } from './entities/reaction.entity';
import { PinnedMessageEntity } from './entities/pinned-message.entity';
import { MessageReadEntity } from './entities/message-read.entity';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { databaseConfig } from './database/config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return new DataSource(options).initialize();
      },
    }),
    TypeOrmModule.forFeature([
      ConversationEntity,
      ParticipantEntity,
      MessageEntity,
      UserEntity,
      ReactionEntity,
      PinnedMessageEntity,
      MessageReadEntity,
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
