import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DomainExceptionFilter } from '@20206205tech/nestjs-common';
import { Test, TestingModule } from '@nestjs/testing';
import { MESSAGE_BROKER_PORT } from '../../../src/modules/payment/application/ports/messaging/message-broker.port';
import { EMAIL_SENDER_PORT } from '../../../src/modules/payment/application/ports/email/email-sender.port';
import { USER_PROFILE_PORT } from '../../../src/modules/payment/application/ports/service/user-profile.port';
import { PaymentTimeoutProcessor } from '../../../src/modules/payment/application/processors/payment-timeout.processor';

export async function main(module: any): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [module],
  })
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
