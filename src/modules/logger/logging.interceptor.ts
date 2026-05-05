import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { RequestLog } from './entities/request-log.entity';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(RequestLog)
    private readonly requestLogRepo: Repository<RequestLog>,
  ) {}

  // ĐÃ THÊM: Hàm làm sạch dữ liệu để tránh lỗi Circular JSON
  private sanitizeData(data: unknown): Record<string, unknown> | undefined {
    if (!data) return undefined;

    // Nếu object là luồng stream hoặc Express object (thường xảy ra khi dùng @Res())
    if (typeof data === 'object' && ('socket' in data || 'writable' in data)) {
      return { _note: '[Stream/Express Object omitted]' };
    }

    try {
      // Ép kiểu an toàn, nếu có circular dependency sẽ văng lỗi vào catch
      return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
    } catch {
      return { _note: '[Circular or unserializable data omitted]' };
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // 1. LẤY CONTEXT ĐỂ GHI LOG CONSOLE
    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const logger = new Logger(className);

    // 2. TRÍCH XUẤT THÔNG TIN REQUEST
    const startTime = Date.now();
    const method = request.method;
    const url = request.originalUrl || request.url;

    const clientIp =
      (request.headers['x-forwarded-for'] as string) ||
      request.socket.remoteAddress ||
      request.ip;

    const requestId = (request.headers['request-id'] as string) || undefined;
    const requestPayload = request.body as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = request.user as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (user?.userId as string) || 'Unknown User';

    // 3. IN LOG CONSOLE TRƯỚC KHI XỬ LÝ
    const logPrefix = `[requestId:${requestId}][method:${method}][url:${url}][methodName:${methodName}]`;

    // Try-catch riêng cho console log để không crash app nếu requestPayload bị lỗi circular
    try {
      logger.debug(
        `${logPrefix} [START] - User: ${userId} - Payload: ${JSON.stringify(requestPayload)}`,
      );
    } catch {
      logger.debug(
        `${logPrefix} [START] - User: ${userId} - Payload: [Unserializable]`,
      );
    }

    // 4. HÀM LƯU LOG VÀO DATABASE
    const saveLog = (statusCode: number, responsePayload: unknown) => {
      const processTime = (Date.now() - startTime) / 1000;

      this.requestLogRepo
        .insert({
          requestId,
          method,
          url,
          clientIp,
          statusCode,
          // ĐÃ SỬA: Đưa qua hàm sanitize trước khi insert
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          requestPayload: this.sanitizeData(requestPayload) as any,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          responsePayload: this.sanitizeData(responsePayload) as any,
          processTime,
        })
        .catch((err: unknown) => {
          logger.error('Lỗi khi ghi log vào DB:', err);
        });
    };

    // 5. THEO DÕI LUỒNG BẰNG RXJS VÀ XỬ LÝ KẾT QUẢ
    return next.handle().pipe(
      tap({
        // Nếu API chạy thành công
        next: (resData: unknown) => {
          logger.debug(
            `${logPrefix} [END] - Completed in ${Date.now() - startTime}ms`,
          );
          saveLog(response.statusCode, resData);
        },

        // Nếu API xảy ra lỗi
        error: (err: unknown) => {
          let statusCode = 500;
          let errorResponse: unknown = 'Internal Server Error';

          if (err instanceof HttpException) {
            statusCode = err.getStatus();
            errorResponse = err.getResponse();
          } else if (err instanceof Error) {
            errorResponse = err.message;
          }

          logger.error(
            `${logPrefix} [END] - Failed in ${Date.now() - startTime}ms - Error: ${statusCode}`,
          );
          saveLog(statusCode, errorResponse);
        },
      }),
    );
  }
}
