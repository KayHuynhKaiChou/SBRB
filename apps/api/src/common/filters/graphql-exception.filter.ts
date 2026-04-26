import {
  ArgumentsHost,
  Catch,
  HttpException,
  Logger,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { API_CODE, type ILocalizedMessage } from '@sbrb/shared-types';

/**
 * Maps NestJS HttpException status → IApiResponse code (TApiCode numeric).
 * Unknown statuses fall back to INTERNAL_ERROR.
 */
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

/**
 * GraphQL global exception filter — re-throws all errors as GraphQLError with
 * extensions matching the IApiResponse contract: { code (number), message ({vi,en}), stack? }.
 *
 * Resolvers/services can throw any HttpException with payload:
 *   throw new NotFoundException({ message: { vi: 'Không tìm thấy', en: 'Not found' } });
 *
 * Plain string payloads are auto-promoted to {vi, en} duplicates so legacy
 * throws keep working.
 *
 * NOT YET wired (registered) — wiring happens in P1 once apolloErrorLink (FE)
 * is updated to recognize numeric codes alongside the legacy string codes.
 */
@Catch()
export class GqlGlobalExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GqlGlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // Skip non-GraphQL contexts — REST traffic stays on the existing HTTP filter
    if (host.getType<'http' | 'graphql'>() !== 'graphql') {
      throw exception;
    }

    let code: number = API_CODE.INTERNAL_ERROR;
    let message: ILocalizedMessage = DEFAULT_ERROR_MESSAGE;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      code = HTTP_STATUS_TO_API_CODE[exception.getStatus()] ?? API_CODE.INTERNAL_ERROR;
      message = this.extractMessage(exception.getResponse()) ?? message;
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      if (process.env.NODE_ENV !== 'production') {
        stack = exception.stack;
        message = { vi: exception.message, en: exception.message };
      }
    }

    return new GraphQLError(message.en, {
      extensions: { code, message, stack: stack ?? null },
    });
  }

  /** Pull a LocalizedMessage out of an HttpException response payload. */
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
