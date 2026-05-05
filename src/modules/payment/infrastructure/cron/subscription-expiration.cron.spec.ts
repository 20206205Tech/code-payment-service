/* eslint-disable @typescript-eslint/unbound-method */
import { UserId } from '@20206205tech/nestjs-common';
import { EventPublisher } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PLAN_REPOSITORY_PORT,
  PlanRepositoryPort,
} from '../../application/ports/database/plan.repository.port';
import {
  SUBSCRIPTION_REPOSITORY_PORT,
  SubscriptionRepositoryPort,
} from '../../application/ports/database/subscription.repository.port';
import {
  EMAIL_SENDER_PORT,
  EmailSenderPort,
} from '../../application/ports/email/email-sender.port';
import {
  USER_PROFILE_PORT,
  UserProfilePort,
} from '../../application/ports/service/user-profile.port';
import { Plan } from '../../domain/entities/plan';
import { Subscription } from '../../domain/entities/subscription';
import { Money } from '../../domain/value-objects/money';
import { PlanId } from '../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { SubscriptionExpirationCron } from './subscription-expiration.cron';
import { PaymentDomainService } from '../../domain/services/payment.domain-service';

const SUB_UUID = '33333333-3333-3333-8333-333333333333';
const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

describe('SubscriptionExpirationCron', () => {
  let cron: SubscriptionExpirationCron;
  let subscriptionRepo: jest.Mocked<SubscriptionRepositoryPort>;
  let planRepo: jest.Mocked<PlanRepositoryPort>;
  let userProfileService: jest.Mocked<UserProfilePort>;
  let notificationService: jest.Mocked<EmailSenderPort>;
  let publisher: jest.Mocked<EventPublisher>;

  beforeEach(async () => {
    subscriptionRepo = {
      findActiveExpiringBefore: jest.fn(),
      findActiveExpiringBetween: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<SubscriptionRepositoryPort>;
    planRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<PlanRepositoryPort>;
    userProfileService = {
      getProfile: jest.fn(),
    } as unknown as jest.Mocked<UserProfilePort>;
    notificationService = {
      sendSubscriptionExpiredEmail: jest.fn(),
      sendSubscriptionExpirationWarningEmail: jest.fn(),
    } as unknown as jest.Mocked<EmailSenderPort>;
    publisher = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      mergeObjectContext: jest.fn((obj) => obj),
    } as unknown as jest.Mocked<EventPublisher>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionExpirationCron,
        { provide: SUBSCRIPTION_REPOSITORY_PORT, useValue: subscriptionRepo },
        { provide: PLAN_REPOSITORY_PORT, useValue: planRepo },
        { provide: USER_PROFILE_PORT, useValue: userProfileService },
        { provide: EMAIL_SENDER_PORT, useValue: notificationService },
        { provide: EventPublisher, useValue: publisher },
        PaymentDomainService,
      ],
    }).compile();

    cron = module.get<SubscriptionExpirationCron>(SubscriptionExpirationCron);
  });

  it('should be defined', () => {
    expect(cron).toBeDefined();
  });

  describe('processExpirations()', () => {
    it('should expire subscriptions and send email', async () => {
      const now = new Date();
      const mockSub = Subscription.reconstitute({
        id: new SubscriptionId(SUB_UUID),
        userId: new UserId(USER_UUID),
        planId: new PlanId(PLAN_UUID),
        startDate: new Date(),
        endDate: now,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (mockSub as any).expire = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (mockSub as any).commit = jest.fn();

      subscriptionRepo.findActiveExpiringBefore.mockResolvedValue([mockSub]);
      subscriptionRepo.findActiveExpiringBetween.mockResolvedValue([]);
      userProfileService.getProfile.mockResolvedValue({
        email: 'test@example.com',
        fullName: 'Test User',
      });
      planRepo.findById.mockResolvedValue(
        Plan.create('Pro Plan', 1, new Money(100000)),
      );

      await cron.handleSubscriptionExpiration();

      expect(subscriptionRepo.findActiveExpiringBefore).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((mockSub as any).expire).toHaveBeenCalled();
      expect(subscriptionRepo.save).toHaveBeenCalledWith(mockSub);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((mockSub as any).commit).toHaveBeenCalled();
      expect(
        notificationService.sendSubscriptionExpiredEmail,
      ).toHaveBeenCalledWith('test@example.com', 'Test User', 'Pro Plan');
    });

    it('should log when no subscriptions found', async () => {
      subscriptionRepo.findActiveExpiringBefore.mockResolvedValue([]);
      subscriptionRepo.findActiveExpiringBetween.mockResolvedValue([]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const loggerSpy = jest.spyOn((cron as any).logger, 'log');
      await cron.handleSubscriptionExpiration();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Không có subscription nào hết hạn cần xử lý.',
      );
    });
  });

  describe('processNotifications()', () => {
    it('should send warning email for subscriptions expiring tomorrow', async () => {
      const mockSub = Subscription.reconstitute({
        id: new SubscriptionId(SUB_UUID),
        userId: new UserId(USER_UUID),
        planId: new PlanId(PLAN_UUID),
        startDate: new Date(),
        endDate: new Date(),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      subscriptionRepo.findActiveExpiringBefore.mockResolvedValue([]);
      subscriptionRepo.findActiveExpiringBetween.mockResolvedValue([mockSub]);
      userProfileService.getProfile.mockResolvedValue({
        email: 'warn@example.com',
        fullName: 'Warn User',
      });
      planRepo.findById.mockResolvedValue(
        Plan.create('Basic Plan', 1, new Money(50000)),
      );

      await cron.handleSubscriptionExpiration();

      expect(subscriptionRepo.findActiveExpiringBetween).toHaveBeenCalled();
      expect(
        notificationService.sendSubscriptionExpirationWarningEmail,
      ).toHaveBeenCalledWith('warn@example.com', 'Warn User', 'Basic Plan', 1);
    });
  });
});
