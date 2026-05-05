import { TransactionAlreadyProcessedException } from './transaction-already-processed.exception';

describe('TransactionAlreadyProcessedException', () => {
  it('should create with message including transaction ID', () => {
    const id = 'TX_123';
    const exception = new TransactionAlreadyProcessedException(id);
    expect(exception.message).toContain(id);
    expect(exception.message).toContain('đã được xử lý');
  });
});
