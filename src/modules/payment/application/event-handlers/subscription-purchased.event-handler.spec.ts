/* eslint-disable @typescript-eslint/unbound-method */
import { UserId } from '@20206205tech/nestjs-common';
import { PlanRepositoryPort } from '../../application/ports/database/plan.repository.port';
import { TransactionRepositoryPort } from '../../application/ports/database/transaction.repository.port';
import { EmailSenderPort } from '../../application/ports/email/email-sender.port';
import { UserProfilePort } from '../../application/ports/service/user-profile.port';
import { Plan } from '../../domain/entities/plan';
import { Transaction } from '../../domain/entities/transaction';
import { SubscriptionPurchasedEvent } from '../../domain/events/subscription-purchased.event';
import { Money } from '../../domain/value-objects/money';
import { PlanDurationMonths } from '../../domain/value-objects/plan-duration-months';
import { PlanId } from '../../domain/value-objects/plan-id';
import { PlanName } from '../../domain/value-objects/plan-name';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { SubscriptionPurchasedEventHandler } from './subscription-purchased.event-handler';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';

function makeTxnWithEmail(email: string): Transaction {
  return Transaction.create(
    new UserId(USER_UUID),
    new SubscriptionId(SUB_UUID),
    new PlanId(PLAN_UUID),
    new Money(100000),
    new Money(0),
    new Money(100000),
    'TXN_REF',
    'vnpay',
    { customer_email: email },
  );
}

const mockUserProfilePort = {
  getProfile: jest.fn(),
} as unknown as jest.Mocked<UserProfilePort>;
const mockPlanRepo = {
  findById: jest.fn(),
  findAllActive: jest.fn(),
  save: jest.fn(),
} as unknown as jest.Mocked<PlanRepositoryPort>;
const mockTransactionRepo = {
  findBySubscriptionId: jest.fn(),
  findById: jest.fn(),
  findByTxnRef: jest.fn(),
  findAllByUserId: jest.fn(),
  findPendingExpired: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<TransactionRepositoryPort>;
const mockEmailSender = {
  sendPaymentSuccessEmail: jest.fn(),
} as unknown as jest.Mocked<EmailSenderPort>;

describe('SubscriptionPurchasedEventHandler', () => {
  let handler: SubscriptionPurchasedEventHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new SubscriptionPurchasedEventHandler(
      mockUserProfilePort,
      mockPlanRepo,
      mockTransactionRepo,
      mockEmailSender,
    );
  });

  const makeEvent = () =>
    new SubscriptionPurchasedEvent(
      SUB_UUID,
      USER_UUID,
      PLAN_UUID,
      new Date(),
      new Date(),
    );

  it('should skip email when no customer_email in transaction metadata', async () => {
    const txn = Transaction.create(
      new UserId(USER_UUID),
      new SubscriptionId(SUB_UUID),
      new PlanId(PLAN_UUID),
      new Money(100000),
      new Money(0),
      new Money(100000),
      'TXN_REF',
      'vnpay',
    );
    mockTransactionRepo.findBySubscriptionId.mockResolvedValue(txn);

    await handler.handle(makeEvent());

    expect(mockEmailSender.sendPaymentSuccessEmail).not.toHaveBeenCalled();
  });

  it('should send email when customer_email is present', async () => {
    const txn = makeTxnWithEmail('user@example.com');
    mockTransactionRepo.findBySubscriptionId.mockResolvedValue(txn);
    mockUserProfilePort.getProfile.mockResolvedValue({
      fullName: 'Nguyễn Văn A',
    });
    mockPlanRepo.findById.mockResolvedValue(
      Plan.create(
        new PlanName('Pro'),
        new PlanDurationMonths(1),
        new Money(99000),
      ),
    );
    mockEmailSender.sendPaymentSuccessEmail.mockResolvedValue(undefined);

    await handler.handle(makeEvent());

    expect(mockEmailSender.sendPaymentSuccessEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Nguyễn Văn A',
      'Pro',
      'TXN_REF',
    );
  });

  it('should use "Bạn" as fallback name when profile not found', async () => {
    const txn = makeTxnWithEmail('user@example.com');
    mockTransactionRepo.findBySubscriptionId.mockResolvedValue(txn);
    mockUserProfilePort.getProfile.mockResolvedValue(null);
    mockPlanRepo.findById.mockResolvedValue(
      Plan.create(
        new PlanName('Basic'),
        new PlanDurationMonths(1),
        new Money(50000),
      ),
    );
    mockEmailSender.sendPaymentSuccessEmail.mockResolvedValue(undefined);

    await handler.handle(makeEvent());

    expect(mockEmailSender.sendPaymentSuccessEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Bạn',
      'Basic',
      'TXN_REF',
    );
  });

  it('should not throw when an error occurs (handle gracefully)', async () => {
    mockTransactionRepo.findBySubscriptionId.mockRejectedValue(
      new Error('DB error'),
    );
    await expect(handler.handle(makeEvent())).resolves.not.toThrow();
  });
});
