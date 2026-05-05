import { TransactionEntity } from './transaction.entity';

describe('TransactionEntity', () => {
  it('should be able to create a new instance', () => {
    const entity = new TransactionEntity();
    entity.id = 'txn-123';
    entity.userId = 'user-456';
    entity.paymentStatus = 'pending';

    expect(entity.id).toBe('txn-123');
    expect(entity.paymentStatus).toBe('pending');
  });
});
