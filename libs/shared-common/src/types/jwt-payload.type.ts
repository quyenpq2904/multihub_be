import { Uuid } from './common.type';

export type JwtPayloadType = {
  id: Uuid;
  sessionId: Uuid;
  iat: number;
  exp: number;
};
