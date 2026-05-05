/* eslint-disable @typescript-eslint/unbound-method */
import { UserId } from '@20206205tech/nestjs-common';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { Subscription } from '../../domain/entities/subscription';
import { Transaction } from '../../domain/entities/transaction';
import { Money } from '../../domain/value-objects/money';
import { PAYMENT_TIMEOUT_QUEUE } from '../../domain/value-objects/constants';
import { PlanId } from '../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { TransactionId } from '../../domain/value-objects/transaction-id';
import {
  SUBSCRIPTION_REPOSITORY_PORT,
  SubscriptionRepositoryPort,
} from '../ports/database/subscription.repository.port';
import {
  TRANSACTION_REPOSITORY_PORT,
  TransactionRepositoryPort,
} from '../ports/database/transaction.repository.port';
import { PaymentTimeoutProcessor } from './payment-timeout.processor';
import { PaymentDomainService } from '../../domain/services/payment.domain-service';

const TXN_UUID = '44444444-4444-4444-8444-444444444444';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';
const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

interface PaymentTimeoutJobData {
  transactionId: string;
}

describe('PaymentTimeoutProcessor', () => {
  let processor: PaymentTimeoutProcessor;
  let transactionRepo: jest.Mocked<TransactionRepositoryPort>;
  let subscriptionRepo: jest.Mocked<SubscriptionRepositoryPort>;

  beforeEach(async () => {
    transactionRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<TransactionRepositoryPort>;
    subscriptionRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<SubscriptionRepositoryPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentTimeoutProcessor,
        { provide: TRANSACTION_REPOSITORY_PORT, useValue: transactionRepo },
        { provide: SUBSCRIPTION_REPOSITORY_PORT, useValue: subscriptionRepo },
        PaymentDomainService,
      ],
    }).compile();

    processor = module.get<PaymentTimeoutProcessor>(PaymentTimeoutProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process()', () => {
    it('should skip processing if job name is incorrect', async () => {
      const mockJob = {
        name: 'WRONG_NAME',
        data: { transactionId: TXN_UUID },
      } as unknown as Job<PaymentTimeoutJobData, any, string>;
      const handleSpy = jest.spyOn(processor as any, 'handleExpiration');

      await processor.process(mockJob);
      expect(handleSpy).not.toHaveBeenCalled();
    });

    it('should mark pending transaction and subscription as expired', async () => {
      const mockJob = {
        name: PAYMENT_TIMEOUT_QUEUE,
        data: { transactionId: TXN_UUID },
      } as unknown as Job<PaymentTimeoutJobData, any, string>;

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

      transactionRepo.findById.mockResolvedValue(mockTxn);
      subscriptionRepo.findById.mockResolvedValue(mockSub);

      await processor.process(mockJob);

      expect(transactionRepo.findById).toHaveBeenCalled();
      expect(mockTxn.markExpired).toHaveBeenCalled();
      expect(transactionRepo.save).toHaveBeenCalledWith(mockTxn);
      expect(mockSub.expire).toHaveBeenCalled();
      expect(subscriptionRepo.save).toHaveBeenCalledWith(mockSub);
    });

    it('should skip expiration if transaction is not pending', async () => {
      const mockJob = {
        name: PAYMENT_TIMEOUT_QUEUE,
        data: { transactionId: TXN_UUID },
      } as unknown as Job<PaymentTimeoutJobData, any, string>;
      const mockTxn = Transaction.reconstitute({
        id: new TransactionId(TXN_UUID),
        userId: new UserId(USER_UUID),
        subscriptionId: new SubscriptionId(SUB_UUID),
        planId: new PlanId(PLAN_UUID),
        baseAmount: new Money(1),
        discountAmount: new Money(0),
        finalAmount: new Money(1),
        transactionRef: 'R',
        paymentMethod: 'v',
        paymentStatus: 'success', // NOT PENDING
        providerTransactionId: null,
        paymentMetadata: {},
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      transactionRepo.findById.mockResolvedValue(mockTxn);
      await processor.process(mockJob);

      expect(transactionRepo.save).not.toHaveBeenCalled();
      expect(subscriptionRepo.findById).not.toHaveBeenCalled();
    });
  });
});
