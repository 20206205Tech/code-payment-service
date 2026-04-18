import { TransactionId } from './transaction-id';

describe('TransactionId', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('should create an instance with a valid UUID', () => {
    const transactionId = new TransactionId(validUuid);
    expect(transactionId).toBeDefined();
    expect(transactionId.value).toBe(validUuid);
  });

  it('should generate a new instance using the create() factory method', () => {
    const transactionId = TransactionId.create();
    expect(transactionId).toBeDefined();
    // Đảm bảo value được sinh ra là một string không rỗng
    expect(typeof transactionId.value).toBe('string');
    expect(transactionId.value.length).toBeGreaterThan(0);
  });

  describe('equals()', () => {
    it('should correctly evaluate equality between TransactionIds', () => {
      const id1 = new TransactionId(validUuid);
      const id2 = new TransactionId(validUuid);
      const id3 = TransactionId.create();

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });
  });
});
