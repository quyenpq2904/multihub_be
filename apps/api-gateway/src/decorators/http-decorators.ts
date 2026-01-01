import {
  applyDecorators,
  HttpCode,
  HttpStatus,
  UseGuards,
  type Type,
} from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { STATUS_CODES } from 'http';
import { Public } from './public.decorartor';
import { ApiPaginatedResponse } from './swagger.decorators';
import { ErrorDto } from '@multihub/shared-common';

type ApiResponseType = number;
type ApiAuthType = 'basic' | 'jwt';
type PaginationType = 'offset' | 'cursor';

interface IApiOptions<T extends Type<any>> {
  type?: T;
  summary?: string;
  description?: string;
  errorResponses?: ApiResponseType[];
  statusCode?: HttpStatus;
  isPaginated?: boolean;
  paginationType?: PaginationType;
}

type IApiPublicOptions = IApiOptions<Type<any>>;

interface IApiAuthOptions extends IApiOptions<Type<any>> {
  auths?: ApiAuthType[];
}

export const ApiPublic = (options: IApiPublicOptions = {}): MethodDecorator => {
  const defaultStatusCode = HttpStatus.OK;
  const defaultErrorResponses = [
    HttpStatus.BAD_REQUEST,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.INTERNAL_SERVER_ERROR,
  ];
  const isPaginated = options.isPaginated || false;
  const ok = {
    type: options.type ?? (Object as Type<any>),
    description: options?.description ?? 'OK',
    paginationType: options.paginationType || 'offset',
  };

  const errorResponses = (options.errorResponses || defaultErrorResponses)?.map(
    (statusCode) =>
      ApiResponse({
        status: statusCode,
        type: ErrorDto,
        description: STATUS_CODES[statusCode],
      }),
  );

  return applyDecorators(
    Public(),
    ApiOperation({ summary: options?.summary }),
    HttpCode(options.statusCode || defaultStatusCode),
    isPaginated ? ApiPaginatedResponse(ok) : ApiOkResponse(ok),
    ...errorResponses,
  );
};

export const ApiAuth = (options: IApiAuthOptions = {}): MethodDecorator => {
  const defaultStatusCode = HttpStatus.OK;
  const defaultErrorResponses = [
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.INTERNAL_SERVER_ERROR,
  ];
  const isPaginated = options.isPaginated || false;
  const ok = {
    type: options.type ?? (Object as Type<any>),
    description: options?.description ?? 'OK',
    paginationType: options.paginationType || 'offset',
  };
  const auths = options.auths || ['jwt'];

  const errorResponses = (options.errorResponses || defaultErrorResponses)?.map(
    (statusCode) =>
      ApiResponse({
        status: statusCode,
        type: ErrorDto,
        description: STATUS_CODES[statusCode],
      }),
  );

  const authDecorators = auths.map((auth) => {
    switch (auth) {
      case 'basic':
        return ApiBasicAuth();
      case 'jwt':
        return ApiBearerAuth();
    }
  });

  const decoratorsToApply = [
    ApiOperation({ summary: options?.summary }),
    HttpCode(options.statusCode || defaultStatusCode),
    isPaginated
      ? ApiPaginatedResponse(ok)
      : options.statusCode === HttpStatus.CREATED
        ? ApiCreatedResponse(ok)
        : ApiOkResponse(ok),
    ...authDecorators,
    ...errorResponses,
  ];

  if (auths.includes('jwt')) {
    decoratorsToApply.push(UseGuards(AuthGuard));
  }

  return applyDecorators(...decoratorsToApply);
};
