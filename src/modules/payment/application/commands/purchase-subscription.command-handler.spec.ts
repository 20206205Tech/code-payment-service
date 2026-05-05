/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { PlanNotFoundException } from '../../domain/exceptions/plan-not-found.exception';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { PurchaseSubscriptionCommandHandler } from './purchase-subscription.command-handler';
import { PurchaseSubscriptionCommand } from './purchase-subscription.command';
import { Plan } from '../../domain/entities/plan';
import { Money } from '../../domain/value-objects/money';
import { PlanRepositoryPort } from '../../application/ports/database/plan.repository.port';
import { SubscriptionRepositoryPort } from '../../application/ports/database/subscription.repository.port';
import { TransactionRepositoryPort } from '../../application/ports/database/transaction.repository.port';
import { PaymentGatewayPort } from '../../application/ports/payment/payment-gateway.port';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

function makeActivePlan(): Plan {
  return Plan.create('Pro Monthly', 1, new Money(99000), true);
}

const mockPlanRepo = {
  findById: jest.fn(),
  findAllActive: jest.fn(),
  save: jest.fn(),
} as unknown as jest.Mocked<PlanRepositoryPort>;
const mockSubscriptionRepo = {
  findById: jest.fn(),
  findActiveByUserId: jest.fn(),
  isFirstPurchase: jest.fn(),
  deactivateOtherSubscriptions: jest.fn(),
  findActiveExpiringBefore: jest.fn(),
  findActiveExpiringBetween: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<SubscriptionRepositoryPort>;
const mockTransactionRepo = {
  findById: jest.fn(),
  findByTxnRef: jest.fn(),
  findBySubscriptionId: jest.fn(),
  findAllByUserId: jest.fn(),
  findPendingExpired: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<TransactionRepositoryPort>;
const mockPaymentGateway = {
  createPaymentUrl: jest.fn(),
  verifyIpn: jest.fn(),
} as unknown as jest.Mocked<PaymentGatewayPort>;

const mockPaymentQueue = { add: jest.fn() } as unknown as jest.Mocked<Queue>;
const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('600000'),
  get: jest.fn().mockReturnValue('vnpay'),
} as unknown as jest.Mocked<ConfigService>;

describe('PurchaseSubscriptionCommandHandler', () => {
  let handler: PurchaseSubscriptionCommandHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new PurchaseSubscriptionCommandHandler(
      mockPlanRepo,
      mockSubscriptionRepo,
      mockTransactionRepo,
      mockPaymentGateway,
      mockPaymentQueue,
      mockConfigService,
    );
  });

  it('should throw PlanNotFoundException when plan not found', async () => {
    mockPlanRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new PurchaseSubscriptionCommand(
          USER_UUID,
          'a@b.com',
          PLAN_UUID,
          '127.0.0.1',
          'https://redirect.url',
        ),
      ),
    ).rejects.toThrow(PlanNotFoundException);
  });

  it('should throw PlanNotFoundException when plan is inactive', async () => {
    const plan = Plan.create('Old', 1, new Money(99000), false);
    mockPlanRepo.findById.mockResolvedValue(plan);

    await expect(
      handler.execute(
        new PurchaseSubscriptionCommand(
          USER_UUID,
          'a@b.com',
          PLAN_UUID,
          '127.0.0.1',
          'https://redirect.url',
        ),
      ),
    ).rejects.toThrow(PlanNotFoundException);
  });

  it('should create subscription, transaction, add queue job, and return payment URL', async () => {
    const plan = makeActivePlan();
    const paymentUrl = 'https://payment.example.com/pay?ref=XYZ';

    mockPlanRepo.findById.mockResolvedValue(plan);
    mockSubscriptionRepo.save.mockResolvedValue(undefined);
    mockTransactionRepo.save.mockResolvedValue(undefined);
    mockPaymentQueue.add.mockResolvedValue({} as unknown as any);
    mockPaymentGateway.createPaymentUrl.mockResolvedValue(paymentUrl);

    const result = await handler.execute(
      new PurchaseSubscriptionCommand(
        USER_UUID,
        'user@test.com',
        PLAN_UUID,
        '127.0.0.1',
        'https://redirect.url',
      ),
    );

    expect(result).toBe(paymentUrl);
    expect(mockSubscriptionRepo.save).toHaveBeenCalledTimes(1);
    expect(mockTransactionRepo.save).toHaveBeenCalledTimes(1);
    expect(mockPaymentQueue.add).toHaveBeenCalledTimes(1);

    expect((mockPaymentGateway as any).createPaymentUrl).toHaveBeenCalledTimes(
      1,
    );
  });

  it('should rollback subscription and transaction on gateway error', async () => {
    const plan = makeActivePlan();

    mockPlanRepo.findById.mockResolvedValue(plan);
    mockSubscriptionRepo.save.mockResolvedValue(undefined);
    mockTransactionRepo.save.mockResolvedValue(undefined);
    mockPaymentQueue.add.mockResolvedValue(undefined);
    mockPaymentGateway.createPaymentUrl.mockRejectedValue(
      new Error('Gateway down'),
    );
    mockTransactionRepo.delete.mockResolvedValue(undefined);
    mockSubscriptionRepo.delete.mockResolvedValue(undefined);

    await expect(
      handler.execute(
        new PurchaseSubscriptionCommand(
          USER_UUID,
          'a@b.com',
          PLAN_UUID,
          '127.0.0.1',
          'https://redirect.url',
        ),
      ),
    ).rejects.toThrow();

    expect(mockTransactionRepo.delete).toHaveBeenCalledTimes(1);
    expect(mockSubscriptionRepo.delete).toHaveBeenCalledTimes(1);
  });
});
