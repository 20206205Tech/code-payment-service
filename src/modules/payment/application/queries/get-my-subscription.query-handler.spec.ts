import { UserId } from '@20206205tech/nestjs-common';
import { Subscription } from '../../domain/entities/subscription';
import { PlanId } from '../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { SubscriptionStatus } from '../../domain/value-objects/subscription-status';
import { SubscriptionRepositoryPort } from '../ports/database/subscription.repository.port';
import { GetMySubscriptionQuery } from './get-my-subscription.query';
import { GetMySubscriptionQueryHandler } from './get-my-subscription.query-handler';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';

function makeActiveSubscription(daysFromNow: number): Subscription {
  const now = new Date();
  const end = new Date(now.getTime() + daysFromNow * 86400000);
  return Subscription.reconstitute({
    id: new SubscriptionId(SUB_UUID),
    userId: new UserId(USER_UUID),
    planId: new PlanId(PLAN_UUID),
    startDate: now,
    endDate: end,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    version: 1,
  });
}

const mockSubscriptionRepo = {
  findActiveByUserId: jest.fn(),
  findLatestActiveSubscription: jest.fn(),
  findAllActiveByUserId: jest.fn(),
  findById: jest.fn(),
  isFirstPurchase: jest.fn(),
  deactivateOtherSubscriptions: jest.fn(),
  findActiveExpiringBefore: jest.fn(),
  findActiveExpiringBetween: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<SubscriptionRepositoryPort>;

describe('GetMySubscriptionQueryHandler', () => {
  let handler: GetMySubscriptionQueryHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetMySubscriptionQueryHandler(mockSubscriptionRepo);
  });

  it('should return has_active_subscription=false when no subscription found', async () => {
    mockSubscriptionRepo.findAllActiveByUserId.mockResolvedValue([]);

    const result = await handler.execute(new GetMySubscriptionQuery(USER_UUID));

    expect(result.has_active_subscription).toBe(false);
    expect(result.subscription).toBeNull();
    expect(result.days_remaining).toBeNull();
  });

  it('should return has_active_subscription=false when subscription is expired (endDate < now)', async () => {
    // endDate in the past
    const sub = makeActiveSubscription(-1);
    mockSubscriptionRepo.findAllActiveByUserId.mockResolvedValue([sub]);

    const result = await handler.execute(new GetMySubscriptionQuery(USER_UUID));
    expect(result.has_active_subscription).toBe(false);
  });

  it('should return has_active_subscription=true and days_remaining when subscription is valid', async () => {
    const sub = makeActiveSubscription(15);
    mockSubscriptionRepo.findAllActiveByUserId.mockResolvedValue([sub]);

    const result = await handler.execute(new GetMySubscriptionQuery(USER_UUID));

    expect(result.has_active_subscription).toBe(true);
    expect(result.subscription).toBeDefined();
    expect(result.days_remaining).toBeGreaterThan(0);
    expect(result.days_remaining).toBeLessThanOrEqual(15);
  });

  it('should return correct subscription shape', async () => {
    const sub = makeActiveSubscription(30);
    mockSubscriptionRepo.findAllActiveByUserId.mockResolvedValue([sub]);

    const result = await handler.execute(new GetMySubscriptionQuery(USER_UUID));

    expect(result.subscription).toMatchObject({
      id: SUB_UUID,
      user_id: USER_UUID,
      plan_id: PLAN_UUID,
      status: 'active',
    });
  });

  it('should calculate total remaining days when multiple subscriptions are stacked', async () => {
    const now = new Date();
    const sub1 = Subscription.reconstitute({
      id: new SubscriptionId('55555555-5555-4555-a555-555555555555'),
      userId: new UserId(USER_UUID),
      planId: new PlanId(PLAN_UUID),
      startDate: now,
      endDate: new Date(now.getTime() + 10 * 86400000), // 10 days
      status: SubscriptionStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });
    const sub2 = Subscription.reconstitute({
      id: new SubscriptionId('66666666-6666-4666-a666-666666666666'),
      userId: new UserId(USER_UUID),
      planId: new PlanId(PLAN_UUID),
      startDate: sub1.endDate,
      endDate: new Date(sub1.endDate.getTime() + 20 * 86400000), // 20 days more
      status: SubscriptionStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    mockSubscriptionRepo.findAllActiveByUserId.mockResolvedValue([sub1, sub2]);

    const result = await handler.execute(new GetMySubscriptionQuery(USER_UUID));

    expect(result.has_active_subscription).toBe(true);
    expect(result.days_remaining).toBe(30);
  });
});
