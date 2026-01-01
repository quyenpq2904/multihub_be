import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayloadType } from '@multihub/shared-common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request['user'] as JwtPayloadType;

    return data ? user?.[data as keyof JwtPayloadType] : user;
  },
);
