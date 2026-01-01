export const IS_PUBLIC = 'isPublic';
export const IS_AUTH_OPTIONAL = 'isAuthOptional';

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export const loggingRedactPaths = [
  'req.headers.authorization',
  'req.body.token',
  'req.body.refreshToken',
  'req.body.email',
  'req.body.password',
  'req.body.oldPassword',
];

export const DEFAULT_PAGE_LIMIT = 10;
export const DEFAULT_CURRENT_PAGE = 1;

export const MAX_SIZE_IN_BYTES = 5 * 1024 * 1024;
