import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { API_CODE, type IApiResponse, type ILocalizedMessage } from '@sbrb/shared-types';

const HTTP_STATUS_TO_API_CODE: Record<number, number> = {
  400: API_CODE.BAD_REQUEST,
  401: API_CODE.UNAUTHORIZED,
  403: API_CODE.FORBIDDEN,
  404: API_CODE.NOT_FOUND,
  409: API_CODE.CONFLICT,
  422: API_CODE.UNPROCESSABLE,
  500: API_CODE.INTERNAL_ERROR,
};

const DEFAULT_ERROR_MESSAGE: ILocalizedMessage = {
  vi: 'Đã xảy ra lỗi',
  en: 'Something went wrong',
};

/** REST exception filter — emits IApiResponse-shaped error body to match GraphQL contract. */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // Only handle HTTP contexts — GraphQL has its own filter (GqlGlobalExceptionFilter)
    if (host.getType<'http' | 'graphql'>() !== 'http') {
      throw exception;
    }
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: ILocalizedMessage = DEFAULT_ERROR_MESSAGE;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exRes = exception.getResponse();
      message = this.extractMessage(exRes) ?? message;
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      if (process.env.NODE_ENV !== 'production') {
        stack = exception.stack;
        message = { vi: exception.message, en: exception.message };
      }
    }

    const body: IApiResponse<null> = {
      code: HTTP_STATUS_TO_API_CODE[status] ?? API_CODE.INTERNAL_ERROR,
      message,
      data: null,
      error: stack ? { stack } : null,
    };

    response.status(status).json(body);
  }

  private extractMessage(payload: string | object): ILocalizedMessage | null {
    if (typeof payload === 'string') return { vi: payload, en: payload };
    if (payload === null || typeof payload !== 'object') return null;

    const raw = (payload as Record<string, unknown>).message;
    if (raw == null) return null;

    if (typeof raw === 'object' && 'vi' in raw && 'en' in raw) {
      const obj = raw as { vi: unknown; en: unknown };
      if (typeof obj.vi === 'string' && typeof obj.en === 'string') {
        return { vi: obj.vi, en: obj.en };
      }
    }
    if (typeof raw === 'string') return { vi: raw, en: raw };
    if (Array.isArray(raw) && raw.every((v) => typeof v === 'string')) {
      const text = raw.join('; ');
      return { vi: text, en: text };
    }
    return null;
  }
}
