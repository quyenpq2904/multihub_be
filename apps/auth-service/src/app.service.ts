import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  RegisterReq,
  RegisterRes,
  LoginReq,
  LoginRes,
  UserCreatedEvent,
  RefreshReq,
  RefreshRes,
  SearchUserReq,
  SearchUserRes,
  UserDto,
} from '@multihub/shared-dtos';
import { UserEntity } from './entities/user.entity';
import { Repository, Not } from 'typeorm';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { verifyPassword } from './utils/password.util';
import * as crypto from 'crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { SessionEntity } from './entities/session.entity';
import {
  Branded,
  JwtPayloadType,
  Uuid,
  OffsetPaginationDto,
} from '@multihub/shared-common';
import { JwtService } from '@nestjs/jwt';
import { AllConfigType } from './config/config.type';
import { ConfigService } from '@nestjs/config';

type Token = Branded<
  {
    accessToken: string;
    refreshToken: string;
  },
  'token'
>;

@Injectable()
export class AppService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async register(data: RegisterReq): Promise<RegisterRes> {
    const isExistUser = await this.userRepository.findOne({
      where: {
        email: data.email,
      },
    });

    if (isExistUser) {
      throw new RpcException({
        code: 6,
        message: 'Email already exists',
      });
    }

    const user = new UserEntity({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
    });

    await user.save();

    const event = new UserCreatedEvent(
      user.id,
      user.email,
      user.fullName,
      user.avatar,
    );
    this.kafkaClient.emit('user_created', event);

    return {
      userId: user.id,
    };
  }

  async signIn(data: LoginReq): Promise<LoginRes> {
    const { email, password } = data;
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password'],
    });

    const isPasswordValid =
      user && (await verifyPassword(password, user.password));

    if (!isPasswordValid) {
      throw new RpcException({
        code: 6,
        message: 'Invalid email or password',
      });
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = new SessionEntity({
      hash,
      userId: user.id,
    });
    await session.save();

    const token = await this.createToken({
      id: user.id,
      sessionId: session.id,
      hash,
    });

    return {
      userId: user.id,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    };
  }

  private async createToken(data: {
    id: string;
    sessionId: string;
    hash: string;
  }): Promise<Token> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: data.id,
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('app.secret', { infer: true }),
          expiresIn: this.configService.getOrThrow('app.expires', {
            infer: true,
          }),
        },
      ),
      this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        {
          secret: this.configService.getOrThrow('app.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('app.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
    } as Token;
  }

  async verifyAccessToken(token: string): Promise<JwtPayloadType> {
    let payload: JwtPayloadType;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('app.secret', { infer: true }),
      });
    } catch (error) {
      console.error('Error verifying access token:', error);
      throw new RpcException({
        code: 16, // UNAUTHENTICATED
        message: 'Invalid or expired token',
      });
    }

    return payload;
  }

  async getMe(data: { userId: string }): Promise<UserDto> {
    const user = await this.userRepository.findOne({
      where: {
        id: data.userId as Uuid,
      },
    });

    if (!user) {
      throw new RpcException({
        code: 5,
        message: 'User not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar ?? '',
      createdAt: user.createdAt?.toISOString() ?? '',
      updatedAt: user.updatedAt?.toISOString() ?? '',
    };
  }

  async refreshToken(dto: RefreshReq): Promise<RefreshRes> {
    const { sessionId, hash } = this.verifyRefreshToken(dto.refreshToken);
    const session = await SessionEntity.findOneBy({ id: sessionId as Uuid });

    if (!session || session.hash !== hash) {
      throw new RpcException({
        code: 16,
        message: 'Invalid or expired session',
      });
    }

    const user = await this.userRepository.findOne({
      where: { id: session.userId },
      select: ['id'],
    });

    if (!user) {
      throw new RpcException({
        code: 16,
        message: 'User not found',
      });
    }

    const newHash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    await SessionEntity.update(session.id, { hash: newHash });

    return await this.createToken({
      id: user.id,
      sessionId: session.id,
      hash: newHash,
    });
  }

  private verifyRefreshToken(token: string): {
    sessionId: string;
    hash: string;
  } {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('app.refreshSecret', {
          infer: true,
        }),
      });
    } catch {
      throw new RpcException({
        code: 16,
        message: 'Invalid refresh token',
      });
    }
  }

  async searchUser(data: SearchUserReq): Promise<SearchUserRes> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (data.q) {
      queryBuilder.where('user.email LIKE :q', { q: `%${data.q}%` });
    }

    if (data.excludedUserId) {
      queryBuilder.andWhere({
        id: Not(data.excludedUserId as Uuid),
      });
    }

    queryBuilder
      .skip(data.offset)
      .take(data.limit)
      .orderBy('user.createdAt', data.order);

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    const pagination = new OffsetPaginationDto(itemCount, data);

    return new SearchUserRes(
      entities.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar ?? '',
        createdAt: user.createdAt?.toISOString() ?? '',
        updatedAt: user.updatedAt?.toISOString() ?? '',
      })),
      pagination,
    );
  }
}
