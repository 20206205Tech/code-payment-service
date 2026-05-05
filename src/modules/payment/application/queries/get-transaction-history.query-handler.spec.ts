import { UserId } from '@20206205tech/nestjs-common';
import { Transaction } from '../../domain/entities/transaction';
import { Money } from '../../domain/value-objects/money';
import { PlanId } from '../../domain/value-objects/plan-id';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { TransactionRepositoryPort } from '../ports/database/transaction.repository.port';
import { GetTransactionHistoryQuery } from './get-transaction-history.query';
import { GetTransactionHistoryQueryHandler } from './get-transaction-history.query-handler';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';
const SUB_UUID = '33333333-3333-3333-8333-333333333333';

function makeTxn(): Transaction {
  return Transaction.create(
    new UserId(USER_UUID),
    new SubscriptionId(SUB_UUID),
    new PlanId(PLAN_UUID),
    new Money(100000),
    new Money(10000),
    new Money(90000),
    'TXN_REF',
    'vnpay',
  );
}

const mockTransactionRepo = {
  findAllByUserId: jest.fn(),
  findById: jest.fn(),
  findByTxnRef: jest.fn(),
  findBySubscriptionId: jest.fn(),
  findPendingExpired: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<TransactionRepositoryPort>;

describe('GetTransactionHistoryQueryHandler', () => {
  let handler: GetTransactionHistoryQueryHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetTransactionHistoryQueryHandler(mockTransactionRepo);
  });

  it('should return empty array when no transactions found', async () => {
    mockTransactionRepo.findAllByUserId.mockResolvedValue([]);
    const result = await handler.execute(
      new GetTransactionHistoryQuery(USER_UUID),
    );
    expect(result).toEqual([]);
  });

  it('should map transactions to TransactionHistoryItem DTOs', async () => {
    mockTransactionRepo.findAllByUserId.mockResolvedValue([makeTxn()]);
    const result = await handler.execute(
      new GetTransactionHistoryQuery(USER_UUID, 0, 20),
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      plan_id: PLAN_UUID,
      base_amount: 100000,
      discount_amount: 10000,
      final_amount: 90000,
      payment_status: 'pending',
      payment_method: 'vnpay',
      paid_at: null,
    });
  });

  it('should pass userId, skip, limit to repository', async () => {
    mockTransactionRepo.findAllByUserId.mockResolvedValue([]);
    await handler.execute(new GetTransactionHistoryQuery(USER_UUID, 10, 5));

    const args = mockTransactionRepo.findAllByUserId.mock.calls[0];

    expect(args[0].value).toBe(USER_UUID);
    expect(args[1]).toBe(10);
    expect(args[2]).toBe(5);
  });

  it('should include id as UUID string', async () => {
    mockTransactionRepo.findAllByUserId.mockResolvedValue([makeTxn()]);
    const result = await handler.execute(
      new GetTransactionHistoryQuery(USER_UUID),
    );
    expect(result[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
