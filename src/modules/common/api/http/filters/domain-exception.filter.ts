// Thư mục: src/modules/common/api/http/filters/domain-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../../domain/exceptions/domain.exception';

// Chỉ bắt các exception kế thừa từ DomainException
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Thông thường các lỗi từ Domain (Business Logic) sẽ trả về 400 Bad Request
    // Bạn có thể tuỳ chỉnh status code nếu trong DomainException của bạn có khai báo mã HTTP
    const status = HttpStatus.BAD_REQUEST;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: exception.name || 'Domain Error',
      message: exception.message,
    });
  }
}
