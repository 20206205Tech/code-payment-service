/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { EventPublisher } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { PlanRepositoryPort } from '../../application/ports/database/plan.repository.port';
import { SubscriptionRepositoryPort } from '../../application/ports/database/subscription.repository.port';
import { TransactionRepositoryPort } from '../../application/ports/database/transaction.repository.port';
// Removed unused PAYMENT_GATEWAY_PORT

import { UserId } from '@20206205tech/nestjs-common';
import { Plan } from '../../domain/entities/plan';
import { Subscription } from '../../domain/entities/subscription';
import { Transaction } from '../../domain/entities/transaction';
import { PaymentDomainService } from '../../domain/services/payment.domain-service';
import { Money } from '../../domain/value-objects/money';
import { PlanDurationMonths } from '../../domain/value-objects/plan-duration-months';
import { PlanId } from '../../domain/value-objects/plan-id';
import { PlanName } from '../../domain/value-objects/plan-name';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { PaymentCallbackCommand } from './payment-callback.command';
import { PaymentCallbackCommandHandler } from './payment-callback.command-handler';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';

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
    { customer_email: 'test@example.com' },
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

const mockPlanRepo = {
  findById: jest.fn(),
  findAllActive: jest.fn(),
  save: jest.fn(),
} as unknown as jest.Mocked<PlanRepositoryPort>;

import { PaymentGatewayPort } from '../../application/ports/payment/payment-gateway.port';

const mockPaymentGateway = {
  createPaymentUrl: jest.fn(),
  verifyIpn: jest.fn(),
  getGateway: jest.fn(),
} as unknown as jest.Mocked<PaymentGatewayPort>;

const mockPublisher = {
  mergeObjectContext: jest.fn((entity: any) => entity),
} as unknown as jest.Mocked<EventPublisher>;
const mockDataSource = {
  transaction: jest.fn((cb: any) => cb()),
} as unknown as DataSource;
const paymentDomainService = new PaymentDomainService();

describe('PaymentCallbackCommandHandler', () => {
  let handler: PaymentCallbackCommandHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new PaymentCallbackCommandHandler(
      mockTransactionRepo,
      mockSubscriptionRepo,
      mockPlanRepo,
      mockPaymentGateway,
      mockDataSource,
      mockPublisher,
      paymentDomainService,
    );
  });

  it('should return success=false when IPN signature is invalid', async () => {
    (mockPaymentGateway.verifyIpn as jest.Mock).mockResolvedValue({
      isValid: false,
      message: 'Sai chữ ký bảo mật',
      txnRef: 'REF',
      isSuccess: false,
      providerTransId: '',
    });

    const result = await handler.execute(
      new PaymentCallbackCommand({}, 'vnpay'),
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('Sai chữ ký');
  });

  it('should return success=false when transaction not found', async () => {
    (mockPaymentGateway.verifyIpn as jest.Mock).mockResolvedValue({
      isValid: true,
      isSuccess: true,
      txnRef: 'UNKNOWN_REF',
      providerTransId: 'P123',
      message: 'ok',
    });
    mockTransactionRepo.findByTxnRef.mockResolvedValue(null);

    const result = await handler.execute(
      new PaymentCallbackCommand({}, 'vnpay'),
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('không tồn tại');
  });

  it('should return success=true and activate subscription on success IPN', async () => {
    const txn = makePendingTransaction();
    const sub = makePendingSubscription();

    (mockPaymentGateway.verifyIpn as jest.Mock).mockResolvedValue({
      isValid: true,
      isSuccess: true,
      txnRef: 'TXN_REF_001',
      providerTransId: 'VNPAY_XYZ',
      message: 'Giao dịch thành công',
    });
    mockTransactionRepo.findByTxnRef.mockResolvedValue(txn);
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
      new PaymentCallbackCommand({ vnp_TxnRef: 'TXN_REF_001' }, 'vnpay'),
    );

    expect(result.success).toBe(true);
    expect(txn.paymentStatus).toBe('success');
    expect(sub.status).toBe('active');
    expect(mockSubscriptionRepo.save).toHaveBeenCalledWith(sub, undefined);
    expect(mockTransactionRepo.save).toHaveBeenCalledWith(txn, undefined);
  });

  it('should mark transaction as failed on failed IPN', async () => {
    const txn = makePendingTransaction();

    (mockPaymentGateway.verifyIpn as jest.Mock).mockResolvedValue({
      isValid: true,
      isSuccess: false,
      txnRef: 'TXN_REF_001',
      providerTransId: '',
      message: 'Giao dịch thất bại',
    });
    mockTransactionRepo.findByTxnRef.mockResolvedValue(txn);
    mockTransactionRepo.save.mockResolvedValue(undefined);

    const result = await handler.execute(
      new PaymentCallbackCommand({}, 'vnpay'),
    );

    expect(result.success).toBe(false);
    expect(txn.paymentStatus).toBe('failed');
  });

  it('should return expired message when transaction is expired', async () => {
    const txn = makePendingTransaction();
    txn.markExpired();

    (mockPaymentGateway.verifyIpn as jest.Mock).mockResolvedValue({
      isValid: true,
      isSuccess: true,
      txnRef: 'TXN_REF_001',
      providerTransId: 'P',
      message: 'ok',
    });
    mockTransactionRepo.findByTxnRef.mockResolvedValue(txn);

    const result = await handler.execute(
      new PaymentCallbackCommand({}, 'vnpay'),
    );

    expect(result.message).toContain('hết hạn');
  });

  it('should not re-process an already processed (success) transaction', async () => {
    const txn = makePendingTransaction();
    txn.markSuccess();

    (mockPaymentGateway.verifyIpn as jest.Mock).mockResolvedValue({
      isValid: true,
      isSuccess: true,
      txnRef: 'TXN_REF_001',
      providerTransId: 'P',
      message: 'ok',
    });
    mockTransactionRepo.findByTxnRef.mockResolvedValue(txn);

    const result = await handler.execute(
      new PaymentCallbackCommand({}, 'vnpay'),
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('đã được xử lý');
    expect(mockSubscriptionRepo.save).not.toHaveBeenCalled();
  });

  it('should return success=false when amount mismatch', async () => {
    const txn = makePendingTransaction(); // Expected amount is 100000

    (mockPaymentGateway.verifyIpn as jest.Mock).mockResolvedValue({
      isValid: true,
      isSuccess: true,
      txnRef: 'TXN_REF_001',
      amount: 500, // Hacker sends 500 instead of 100000
      providerTransId: 'VNPAY_XYZ',
      message: 'ok',
    });
    mockTransactionRepo.findByTxnRef.mockResolvedValue(txn);

    const result = await handler.execute(
      new PaymentCallbackCommand({ vnp_TxnRef: 'TXN_REF_001' }, 'vnpay'),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('Số tiền không khớp');
  });
});
