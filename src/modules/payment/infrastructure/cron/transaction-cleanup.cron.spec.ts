/* eslint-disable @typescript-eslint/unbound-method */
import { UserId } from '@20206205tech/nestjs-common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  SUBSCRIPTION_REPOSITORY_PORT,
  SubscriptionRepositoryPort,
} from '../../application/ports/database/subscription.repository.port';
import {
  TRANSACTION_REPOSITORY_PORT,
  TransactionRepositoryPort,
} from '../../application/ports/database/transaction.repository.port';
import { Subscription } from '../../domain/entities/subscription';
import { Transaction } from '../../domain/entities/transaction';
import { Money } from '../../domain/value-objects/money';
import { PlanId } from '../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { TransactionId } from '../../domain/value-objects/transaction-id';
import { TransactionCleanupCron } from './transaction-cleanup.cron';

const TXN_UUID = '44444444-4444-4444-8444-444444444444';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';
const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

describe('TransactionCleanupCron', () => {
  let cron: TransactionCleanupCron;
  let transactionRepo: jest.Mocked<TransactionRepositoryPort>;
  let subscriptionRepo: jest.Mocked<SubscriptionRepositoryPort>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    transactionRepo = {
      findPendingExpired: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<TransactionRepositoryPort>;
    subscriptionRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<SubscriptionRepositoryPort>;
    configService = {
      getOrThrow: jest.fn().mockReturnValue('600000'), // 10 minutes
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionCleanupCron,
        { provide: TRANSACTION_REPOSITORY_PORT, useValue: transactionRepo },
        { provide: SUBSCRIPTION_REPOSITORY_PORT, useValue: subscriptionRepo },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    cron = module.get<TransactionCleanupCron>(TransactionCleanupCron);
  });

  it('should be defined', () => {
    expect(cron).toBeDefined();
  });

  describe('handleStaleTransactions()', () => {
    it('should mark stale transactions as expired', async () => {
      const mockTxn = Transaction.reconstitute({
        id: new TransactionId(TXN_UUID),
        userId: new UserId(USER_UUID),
        subscriptionId: new SubscriptionId(SUB_UUID),
        planId: new PlanId(PLAN_UUID),
        baseAmount: new Money(100000),
        discountAmount: new Money(0),
        finalAmount: new Money(100000),
        transactionRef: 'REF',
        paymentMethod: 'vnpay',
        paymentStatus: 'pending',
        providerTransactionId: null,
        paymentMetadata: {},
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockTxn.markExpired = jest.fn();

      const mockSub = Subscription.reconstitute({
        id: new SubscriptionId(SUB_UUID),
        userId: new UserId(USER_UUID),
        planId: new PlanId(PLAN_UUID),
        startDate: new Date(),
        endDate: new Date(),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockSub.expire = jest.fn();

      transactionRepo.findPendingExpired.mockResolvedValue([mockTxn]);
      subscriptionRepo.findById.mockResolvedValue(mockSub);

      await cron.handleStaleTransactions();

      expect(transactionRepo.findPendingExpired).toHaveBeenCalled();
      expect(mockTxn.markExpired).toHaveBeenCalled();
      expect(transactionRepo.save).toHaveBeenCalledWith(mockTxn);
      expect(mockSub.expire).toHaveBeenCalled();
      expect(subscriptionRepo.save).toHaveBeenCalledWith(mockSub);
    });

    it('should log when no stale transactions found', async () => {
      transactionRepo.findPendingExpired.mockResolvedValue([]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const loggerSpy = jest.spyOn((cron as any).logger, 'log');

      await cron.handleStaleTransactions();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Không tìm thấy giao dịch nào quá hạn cần xử lý.',
      );
    });
  });
});
