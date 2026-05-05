/* eslint-disable @typescript-eslint/unbound-method */
import { EventPublisher } from '@nestjs/cqrs';
import { PlanRepositoryPort } from '../../application/ports/database/plan.repository.port';
import { SubscriptionRepositoryPort } from '../../application/ports/database/subscription.repository.port';
import { TransactionRepositoryPort } from '../../application/ports/database/transaction.repository.port';

import { UserId } from '@20206205tech/nestjs-common';
import { PaymentGatewayPort } from '../../application/ports/payment/payment-gateway.port';
import { Transaction } from '../../domain/entities/transaction';
import { Money } from '../../domain/value-objects/money';
import { PlanId } from '../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { PaymentReturnCommand } from './payment-return.command';
import { PaymentReturnCommandHandler } from './payment-return.command-handler';

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
  );
}

const mockTransactionRepo = {
  findByTxnRef: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  findBySubscriptionId: jest.fn(),
  findAllByUserId: jest.fn(),
  findPendingExpired: jest.fn(),
} as unknown as jest.Mocked<TransactionRepositoryPort>;
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
const mockPlanRepo = {
  findById: jest.fn(),
  findAllActive: jest.fn(),
  save: jest.fn(),
} as unknown as jest.Mocked<PlanRepositoryPort>;

const mockPaymentGateway = {
  createPaymentUrl: jest.fn(),
  verifyIpn: jest.fn(),
  getGateway: jest.fn(),
} as unknown as jest.Mocked<PaymentGatewayPort>;
const mockPublisher = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  mergeObjectContext: jest.fn((e) => e),
} as unknown as jest.Mocked<EventPublisher>;

describe('PaymentReturnCommandHandler', () => {
  let handler: PaymentReturnCommandHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new PaymentReturnCommandHandler(
      mockTransactionRepo,
      mockSubscriptionRepo,
      mockPlanRepo,
      mockPaymentGateway,
      mockPublisher,
    );
  });

  it('should return success=false when signature is invalid', async () => {
    (mockPaymentGateway.verifyIpn as jest.Mock).mockResolvedValue({
      isValid: false,
      message: 'Chữ ký không hợp lệ',
      txnRef: 'R001',
      isSuccess: false,
      providerTransId: '',
    });

    const result = await handler.execute(new PaymentReturnCommand({}, 'vnpay'));
    expect(result.success).toBe(false);
    expect(result.message).toContain('Chữ ký không hợp lệ');
  });

  it('should return success=false when transaction not found', async () => {
    (mockPaymentGateway.verifyIpn as jest.Mock).mockResolvedValue({
      isValid: true,
      isSuccess: true,
      txnRef: 'UNKNOWN',
      providerTransId: 'P',
      message: 'ok',
    });
    mockTransactionRepo.findByTxnRef.mockResolvedValue(null);

    const result = await handler.execute(new PaymentReturnCommand({}, 'vnpay'));
    expect(result.success).toBe(false);
    expect(result.message).toContain('không tồn tại');
  });

  it('should return expired message for expired transactions', async () => {
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

    const result = await handler.execute(new PaymentReturnCommand({}, 'vnpay'));
    expect(result.success).toBe(false);
    expect(result.message).toContain('hết hạn');
  });

  it('should return verifyResult status without saving DB (read-only)', async () => {
    const txn = makePendingTransaction();

    (mockPaymentGateway.verifyIpn as jest.Mock).mockResolvedValue({
      isValid: true,
      isSuccess: true,
      txnRef: 'TXN_REF_001',
      providerTransId: 'P',
      message: 'Giao dịch thành công',
    });
    mockTransactionRepo.findByTxnRef.mockResolvedValue(txn);

    const result = await handler.execute(new PaymentReturnCommand({}, 'vnpay'));

    expect(result.success).toBe(true);
    expect(result.message).toBe('Giao dịch thành công');
    // Should NOT save anything — return endpoint is read-only
    expect(mockTransactionRepo.save).not.toHaveBeenCalled();
    expect(mockSubscriptionRepo.save).not.toHaveBeenCalled();
  });

  it('should return success=false on exception', async () => {
    (mockPaymentGateway.verifyIpn as jest.Mock).mockRejectedValue(
      new Error('Network error'),
    );
    const result = await handler.execute(new PaymentReturnCommand({}, 'vnpay'));
    expect(result.success).toBe(false);
    expect(result.message).toBe('Lỗi hệ thống');
  });
});
