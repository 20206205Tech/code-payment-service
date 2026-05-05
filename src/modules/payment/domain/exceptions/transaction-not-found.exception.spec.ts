import { TransactionNotFoundException } from './transaction-not-found.exception';

describe('TransactionNotFoundException', () => {
  it('should create with custom message including transaction ID', () => {
    const id = 'TX_123';
    const exception = new TransactionNotFoundException(id);
    expect(exception.message).toContain(id);
  });

  it('should create with default message when no ID provided', () => {
    const exception = new TransactionNotFoundException();
    expect(exception.message).toContain('Không tìm thấy');
  });
});
