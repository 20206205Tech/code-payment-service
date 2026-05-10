import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@20206205tech/nestjs-auth';

@Injectable()
export class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
      user?: Record<string, unknown>;
    }>();

    const userHeader = request.headers['x-test-user'];
    if (userHeader) {
      try {
        request.user = JSON.parse(userHeader) as Record<string, unknown>;
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }
}

@Injectable()
export class MockRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role: string } }>();
    return requiredRoles.some((role) => request.user?.role === role);
  }
}
