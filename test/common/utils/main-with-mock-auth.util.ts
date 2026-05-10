import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DomainExceptionFilter } from '@20206205tech/nestjs-common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, RolesGuard } from '@20206205tech/nestjs-auth';
import { MockJwtAuthGuard, MockRolesGuard } from '../guards/mock-auth.guard';
import { Test, TestingModule } from '@nestjs/testing';
import { MESSAGE_BROKER_PORT } from '../../../src/modules/payment/application/ports/messaging/message-broker.port';
import { EMAIL_SENDER_PORT } from '../../../src/modules/payment/application/ports/email/email-sender.port';
import { USER_PROFILE_PORT } from '../../../src/modules/payment/application/ports/service/user-profile.port';
import { PaymentTimeoutProcessor } from '../../../src/modules/payment/application/processors/payment-timeout.processor';

export async function mainWithMockAuth(module: any): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [module],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(MockJwtAuthGuard)
    .overrideGuard(RolesGuard)
    .useValue(new MockRolesGuard(new Reflector()))
    .overrideProvider(MESSAGE_BROKER_PORT)
    .useValue({
      publishSubscriptionPurchased: jest.fn().mockResolvedValue(undefined),
    })
    .overrideProvider(EMAIL_SENDER_PORT)
    .useValue({
      sendPaymentSuccessEmail: jest.fn().mockResolvedValue(undefined),
      sendSubscriptionExpirationWarningEmail: jest
        .fn()
        .mockResolvedValue(undefined),
      sendSubscriptionExpiredEmail: jest.fn().mockResolvedValue(undefined),
    })
    .overrideProvider(USER_PROFILE_PORT)
    .useValue({
      getProfile: jest.fn().mockResolvedValue({ fullName: 'Test User' }),
    })
    .overrideProvider(PaymentTimeoutProcessor)
    .useValue({})
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('code-payment-service');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.init();

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  const globalAny = global as any;
  globalAny.app = app;
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  return app;
}

export function userHeader(
  overrides: { userId?: string; email?: string; role?: string } = {},
): Record<string, string> {
  return {
    'X-Test-User': JSON.stringify({
      userId: overrides.userId ?? '123e4567-e89b-12d3-a456-426614174001',
      email: overrides.email ?? 'user@test.com',
      role: overrides.role ?? 'authenticated',
    }),
  };
}

export function adminHeader(
  overrides: { userId?: string; email?: string } = {},
): Record<string, string> {
  return {
    'X-Test-User': JSON.stringify({
      userId: overrides.userId ?? '123e4567-e89b-12d3-a456-426614174000',
      email: overrides.email ?? 'admin@test.com',
      role: 'admin',
    }),
  };
}
