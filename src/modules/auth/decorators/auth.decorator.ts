import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SWAGGER_AUTH_KEY } from '../../../constants/swagger.constant';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../constants/auth.constant';
import { UserRole } from '../enums/user-role.enum';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

export const Auth = {
  Public: () => applyDecorators(SetMetadata(IS_PUBLIC_KEY, true)),

  User: () =>
    applyDecorators(
      UseGuards(JwtAuthGuard),
      ApiBearerAuth(SWAGGER_AUTH_KEY),
      ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ),

  Admin: () =>
    applyDecorators(
      UseGuards(JwtAuthGuard, RolesGuard),
      SetMetadata(ROLES_KEY, [UserRole.ADMIN]),
      ApiBearerAuth(SWAGGER_AUTH_KEY),
      ApiUnauthorizedResponse({ description: 'Unauthorized' }),
      ApiForbiddenResponse({ description: 'Forbidden - Requires Admin role' }),
    ),
};
