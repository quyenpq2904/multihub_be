import { Uuid } from './common.type';

export type JwtRefreshPayloadType = {
  sessionId: Uuid;
  hash: string;
  iat: number;
  exp: number;
};
