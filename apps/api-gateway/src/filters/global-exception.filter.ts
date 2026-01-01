import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  ValidationError,
  BadRequestException,
} from '@nestjs/common';
import { STATUS_CODES } from 'http';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import {
  ValidationException,
  ErrorCode,
  ErrorDto,
  ErrorDetailDto,
} from '@multihub/shared-common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private debug = true;
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let error: ErrorDto;

    if (exception instanceof UnprocessableEntityException) {
      error = this.handleUnprocessableEntityException(exception);
    } else if (exception instanceof ValidationException) {
      error = this.handleValidationException(exception);
    } else if (exception instanceof BadRequestException) {
      error = this.handleBadRequestException(exception);
    } else if (exception instanceof HttpException) {
      error = this.handleHttpException(exception);
    } else if (exception instanceof RpcException) {
      error = this.handleRpcException(exception);
    } else if (exception instanceof QueryFailedError) {
      error = this.handleQueryFailedError(exception);
    } else if (exception instanceof EntityNotFoundError) {
      error = this.handleEntityNotFoundError(exception);
    } else {
      error = this.handleError(exception);
    }

    if (this.debug && error.statusCode >= 500) {
      error.stack = exception.stack;
      error.trace = exception;
    }

    // response.status is generic, might need to be cast or handled if express/fastify specific.
    // Assuming Express based on user code.
    response.status(error.statusCode).json(error);
  }

  /**
   * Handles UnprocessableEntityException:
   * Check the request payload
   * Validate the input
   * @param exception UnprocessableEntityException
   * @returns ErrorDto
   */
  private handleUnprocessableEntityException(
    exception: UnprocessableEntityException,
  ): ErrorDto {
    const r = exception.getResponse() as { message: ValidationError[] };
    const statusCode = exception.getStatus();

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode] || 'Unprocessable Entity',
      message: 'Validation failed',
      details: this.extractValidationErrorDetails(r.message),
    };

    this.logger.warn(exception);

    return errorRes;
  }

  /**
   * Handles validation errors
   * @param exception ValidationException
   * @returns ErrorDto
   */
  private handleValidationException(exception: ValidationException): ErrorDto {
    const r = exception.getResponse() as {
      errorCode: ErrorCode;
      message: string;
    };
    const statusCode = exception.getStatus();

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode] || 'Bad Request',
      errorCode:
        Object.keys(ErrorCode)[Object.values(ErrorCode).indexOf(r.errorCode)],
      message: r.message,
    };

    this.logger.warn(exception);

    return errorRes;
  }

  private handleBadRequestException(exception: BadRequestException): ErrorDto {
    const r = exception.getResponse() as {
      message: string | string[];
      error: string;
    };
    const statusCode = exception.getStatus();

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: r.error || STATUS_CODES[statusCode] || 'Bad Request',
      message: Array.isArray(r.message) ? r.message.join(', ') : r.message,
    };

    this.logger.warn(exception);
    return errorRes;
  }

  /**
   * Handles HttpException
   * @param exception HttpException
   * @returns ErrorDto
   */
  private handleHttpException(exception: HttpException): ErrorDto {
    const statusCode = exception.getStatus();
    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode] || 'Internal Server Error',
      message: exception.message,
    };

    if (statusCode >= 500) {
      this.logger.error(exception);
    } else {
      this.logger.warn(exception);
    }

    return errorRes;
  }

  /**
   * Handles RpcException
   * Mapping gRPC codes to HTTP status
   */
  private handleRpcException(exception: RpcException): ErrorDto {
    const error = exception.getError() as
      | { code?: number; message?: string }
      | string;
    let code = 2; // UNKNOWN default
    let message = 'Internal server error';

    if (typeof error === 'object' && error !== null) {
      code = error.code || 2;
      message = error.message || message;
    } else if (typeof error === 'string') {
      message = error;
    }

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    // gRPC code mapping
    switch (code) {
      case 3: // INVALID_ARGUMENT
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      case 5: // NOT_FOUND
        statusCode = HttpStatus.NOT_FOUND;
        break;
      case 6: // ALREADY_EXISTS
        statusCode = HttpStatus.CONFLICT;
        break;
      case 7: // PERMISSION_DENIED
        statusCode = HttpStatus.FORBIDDEN;
        break;
      case 16: // UNAUTHENTICATED
        statusCode = HttpStatus.UNAUTHORIZED;
        break;
      default:
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode] || 'Error',
      message,
    };

    if (statusCode >= 500) {
      this.logger.error(exception);
    } else {
      this.logger.warn(`gRPC Error handled: ${message}`);
    }

    return errorRes;
  }

  /**
   * Handles QueryFailedError
   * @param error QueryFailedError
   * @returns ErrorDto
   */
  private handleQueryFailedError(error: QueryFailedError): ErrorDto {
    const r = error as QueryFailedError & { constraint?: string };
    // Simple logic without i18n
    const { status, message } = r.constraint?.startsWith('UQ')
      ? {
          status: HttpStatus.CONFLICT,
          message: r.constraint || 'Conflict error',
        }
      : {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        };

    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode: status,
      error: STATUS_CODES[status] || 'Internal Server Error',
      message,
    } as unknown as ErrorDto;

    this.logger.error(error);

    return errorRes;
  }

  /**
   * Handles EntityNotFoundError when using findOrFail() or findOneOrFail() from TypeORM
   * @param error EntityNotFoundError
   * @returns ErrorDto
   */
  private handleEntityNotFoundError(error: EntityNotFoundError): ErrorDto {
    const status = HttpStatus.NOT_FOUND;
    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode: status,
      error: STATUS_CODES[status] || 'Not Found',
      message: 'Entity not found',
    } as unknown as ErrorDto;

    this.logger.warn(error);

    return errorRes;
  }

  /**
   * Handles generic errors
   * @param error Error
   * @returns ErrorDto
   */
  private handleError(error: Error): ErrorDto {
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const errorRes: ErrorDto = {
      timestamp: new Date().toISOString(),
      statusCode,
      error: STATUS_CODES[statusCode] || 'Internal Server Error',
      message: error?.message || 'An unexpected error occurred',
    };

    this.logger.error(error);

    return errorRes;
  }

  /**
   * Extracts error details from ValidationError[]
   * @param errors ValidationError[]
   * @returns ErrorDetailDto[]
   */
  private extractValidationErrorDetails(
    errors: ValidationError[],
  ): ErrorDetailDto[] {
    const extractErrors = (
      error: ValidationError,
      parentProperty = '',
    ): ErrorDetailDto[] => {
      const propertyPath = parentProperty
        ? `${parentProperty}.${error.property}`
        : error.property;

      const currentErrors: ErrorDetailDto[] = Object.entries(
        error.constraints || {},
      ).map(([code, message]) => ({
        property: propertyPath,
        code,
        message,
      }));

      const childErrors: ErrorDetailDto[] =
        error.children?.flatMap((childError) =>
          extractErrors(childError, propertyPath),
        ) || [];

      return [...currentErrors, ...childErrors];
    };

    if (!Array.isArray(errors)) {
      return [];
    }

    return errors.flatMap((error) => extractErrors(error));
  }
}
