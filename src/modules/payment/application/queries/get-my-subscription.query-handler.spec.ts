import { UserId } from '@20206205tech/nestjs-common';
import { Subscription } from '../../domain/entities/subscription';
import { PaymentDomainService } from '../../domain/services/payment.domain-service';
import { PlanId } from '../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { SubscriptionStatus } from '../../domain/value-objects/subscription-status';
import { SubscriptionRepositoryPort } from '../ports/database/subscription.repository.port';
import { GetMySubscriptionQuery } from './get-my-subscription.query';
import { GetMySubscriptionQueryHandler } from './get-my-subscription.query-handler';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';

function makeSubscription(
  daysFromNow: number,
  status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
): Subscription {
  const now = new Date();
  const end = new Date(now.getTime() + daysFromNow * 86400000);
  return Subscription.reconstitute({
    id: new SubscriptionId(SUB_UUID),
    userId: new UserId(USER_UUID),
    planId: new PlanId(PLAN_UUID),
    periodStart: now,
    periodEnd: end,
    status,
    createdAt: now,
    updatedAt: now,
    version: 1,
  });
}

const mockSubscriptionRepo = {
  findActiveByUserId: jest.fn(),
  findLatestActiveSubscription: jest.fn(),
  findByUserId: jest.fn(),
  findAllActiveByUserId: jest.fn(),
  findById: jest.fn(),
  isFirstPurchase: jest.fn(),
  deactivateOtherSubscriptions: jest.fn(),
  findActiveExpiringBefore: jest.fn(),
  findActiveExpiringBetween: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} satisfies Pick<SubscriptionRepositoryPort, 'findByUserId'>;

const mockPaymentDomainService = {
  hasActiveSubscription: jest.fn(),
  isSubscriptionActive: jest.fn(),
  prepareSubscriptionForPurchase: jest.fn(),
  expirePayment: jest.fn(),
  fulfillPayment: jest.fn(),
  failPayment: jest.fn(),
} satisfies Pick<PaymentDomainService, 'hasActiveSubscription'>;

describe('GetMySubscriptionQueryHandler', () => {
  let handler: GetMySubscriptionQueryHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetMySubscriptionQueryHandler(
      mockSubscriptionRepo,
      mockPaymentDomainService,
    );
  });

  it('should return has_active_subscription=false when no subscription found', async () => {
    mockSubscriptionRepo.findByUserId.mockResolvedValue(null);
    mockPaymentDomainService.hasActiveSubscription.mockReturnValue(false);

    const result = await handler.execute(new GetMySubscriptionQuery(USER_UUID));

    expect(mockPaymentDomainService.hasActiveSubscription.mock.calls).toEqual([
      [null],
    ]);
    expect(result.has_active_subscription).toBe(false);
  });

  it('should return has_active_subscription=false when subscription is expired', async () => {
    const sub = makeSubscription(-1);
    mockSubscriptionRepo.findByUserId.mockResolvedValue(sub);
    mockPaymentDomainService.hasActiveSubscription.mockReturnValue(false);

    const result = await handler.execute(new GetMySubscriptionQuery(USER_UUID));

    expect(mockPaymentDomainService.hasActiveSubscription.mock.calls).toEqual([
      [sub],
    ]);
    expect(result.has_active_subscription).toBe(false);
  });

  it('should return has_active_subscription=true when subscription is valid', async () => {
    const sub = makeSubscription(15);
    mockSubscriptionRepo.findByUserId.mockResolvedValue(sub);
    mockPaymentDomainService.hasActiveSubscription.mockReturnValue(true);

    const result = await handler.execute(new GetMySubscriptionQuery(USER_UUID));

    expect(mockPaymentDomainService.hasActiveSubscription.mock.calls).toEqual([
      [sub],
    ]);
    expect(result.has_active_subscription).toBe(true);
  });

  it('should return has_active_subscription=false when status is not active', async () => {
    const sub = makeSubscription(10, SubscriptionStatus.PENDING);
    mockSubscriptionRepo.findByUserId.mockResolvedValue(sub);
    mockPaymentDomainService.hasActiveSubscription.mockReturnValue(false);

    const result = await handler.execute(new GetMySubscriptionQuery(USER_UUID));

    expect(mockPaymentDomainService.hasActiveSubscription.mock.calls).toEqual([
      [sub],
    ]);
    expect(result.has_active_subscription).toBe(false);
  });
});
