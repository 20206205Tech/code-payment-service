/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { UserId } from '@20206205tech/nestjs-common';
import { EventBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { PlanRepositoryPort } from '../../application/ports/database/plan.repository.port';
import { SubscriptionRepositoryPort } from '../../application/ports/database/subscription.repository.port';
import { TransactionRepositoryPort } from '../../application/ports/database/transaction.repository.port';
import { Plan } from '../../domain/entities/plan';
import { Subscription } from '../../domain/entities/subscription';
import { Transaction } from '../../domain/entities/transaction';
import { TransactionAlreadyProcessedException } from '../../domain/exceptions/transaction-already-processed.exception';
import { TransactionNotFoundException } from '../../domain/exceptions/transaction-not-found.exception';
import { PaymentDomainService } from '../../domain/services/payment.domain-service';
import { Money } from '../../domain/value-objects/money';
import { PlanDurationMonths } from '../../domain/value-objects/plan-duration-months';
import { PlanId } from '../../domain/value-objects/plan-id';
import { PlanName } from '../../domain/value-objects/plan-name';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { ManualActivateTransactionCommand } from './manual-activate-transaction.command';
import { ManualActivateTransactionCommandHandler } from './manual-activate-transaction.command-handler';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';
const TXN_UUID = '44444444-4444-4444-8444-444444444444';

function makePendingTransaction(): Transaction {
  return Transaction.create(
    new UserId(USER_UUID),
    new SubscriptionId(SUB_UUID),
    new PlanId(PLAN_UUID),
    new Money(100000),
    new Money(0),
    new Money(100000),
    'TXN_REF_001',
    'vnpay',
  );
}

function makePendingSubscription(): Subscription {
  const now = new Date();
  return Subscription.reconstitute({
    id: new SubscriptionId(SUB_UUID),
    userId: new UserId(USER_UUID),
    planId: new PlanId(PLAN_UUID),
    periodStart: now,
    periodEnd: new Date(now.getTime() + 30 * 86400000),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    version: 1,
  });
}

const mockTransactionRepo = {
  findById: jest.fn(),
  findByTxnRef: jest.fn(),
  findBySubscriptionId: jest.fn(),
  findAllByUserId: jest.fn(),
  findPendingExpired: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<TransactionRepositoryPort>;
const mockSubscriptionRepo = {
  findById: jest.fn(),
  findActiveByUserId: jest.fn(),
  findLatestActiveSubscription: jest.fn(),
  findAllActiveByUserId: jest.fn(),
  isFirstPurchase: jest.fn(),
  deactivateOtherSubscriptions: jest.fn(),
  findActiveExpiringBefore: jest.fn(),
  findActiveExpiringBetween: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<SubscriptionRepositoryPort>;
const mockEventBus = {
  publishAll: jest.fn(),
} as unknown as jest.Mocked<EventBus>;
const mockPlanRepo = {
  findById: jest.fn(),
} as unknown as jest.Mocked<PlanRepositoryPort>;
const mockDataSource = {
  transaction: jest.fn((cb: any) => cb()),
} as unknown as DataSource;
const paymentDomainService = new PaymentDomainService();

describe('ManualActivateTransactionCommandHandler', () => {
  let handler: ManualActivateTransactionCommandHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new ManualActivateTransactionCommandHandler(
      mockTransactionRepo,
      mockSubscriptionRepo,
      mockPlanRepo,
      mockDataSource,
      mockEventBus,
      paymentDomainService,
    );
  });

  it('should throw TransactionNotFoundException when transaction not found', async () => {
    mockTransactionRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new ManualActivateTransactionCommand(TXN_UUID)),
    ).rejects.toThrow(TransactionNotFoundException);
  });

  it('should throw TransactionAlreadyProcessedException when transaction already success', async () => {
    const txn = makePendingTransaction();
    txn.markSuccess();
    mockTransactionRepo.findById.mockResolvedValue(txn);

    await expect(
      handler.execute(new ManualActivateTransactionCommand(TXN_UUID)),
    ).rejects.toThrow(TransactionAlreadyProcessedException);
  });

  it('should mark transaction as success and activate subscription', async () => {
    const txn = makePendingTransaction();
    const sub = makePendingSubscription();

    mockTransactionRepo.findById.mockResolvedValue(txn);
    mockSubscriptionRepo.findById.mockResolvedValue(sub);
    mockSubscriptionRepo.findLatestActiveSubscription.mockResolvedValue(null);
    mockSubscriptionRepo.save.mockResolvedValue(undefined);
    mockTransactionRepo.save.mockResolvedValue(undefined);
    mockPlanRepo.findById.mockResolvedValue(
      Plan.create(
        new PlanName('Pro'),
        new PlanDurationMonths(1),
        new Money(100),
        true,
      ),
    );

    const result = await handler.execute(
      new ManualActivateTransactionCommand(TXN_UUID),
    );

    expect(result.paymentStatus).toBe('success');
    expect(result.paidAt).toBeDefined();
    expect(sub.status).toBe('active');
    expect(mockSubscriptionRepo.save).toHaveBeenCalledWith(sub, undefined);
    expect(mockTransactionRepo.save).toHaveBeenCalledWith(txn, undefined);
  });

  it('should add MANUAL_BY_ADMIN to transaction metadata', async () => {
    const txn = makePendingTransaction();
    const sub = makePendingSubscription();

    mockTransactionRepo.findById.mockResolvedValue(txn);
    mockSubscriptionRepo.findById.mockResolvedValue(sub);
    mockSubscriptionRepo.findLatestActiveSubscription.mockResolvedValue(null);
    mockSubscriptionRepo.save.mockResolvedValue(undefined);
    mockTransactionRepo.save.mockResolvedValue(undefined);

    await handler.execute(new ManualActivateTransactionCommand(TXN_UUID));

    expect(txn.paymentMetadata['action']).toBe('MANUAL_BY_ADMIN');
  });

  it('should still succeed even when subscription is not found', async () => {
    const txn = makePendingTransaction();
    mockTransactionRepo.findById.mockResolvedValue(txn);
    mockSubscriptionRepo.findById.mockResolvedValue(null);
    mockTransactionRepo.save.mockResolvedValue(undefined);

    const result = await handler.execute(
      new ManualActivateTransactionCommand(TXN_UUID),
    );
    expect(result.paymentStatus).toBe('success');
    expect(mockSubscriptionRepo.save).not.toHaveBeenCalled();
  });
});
