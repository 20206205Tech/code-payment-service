import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

// Định nghĩa cấu trúc của user payload
export interface JwtPayload {
  userId: string;
  email: string;
  [key: string]: unknown;
}

export interface RequestWithUser extends Request {
  user?: JwtPayload;
}

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user?.userId;
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
