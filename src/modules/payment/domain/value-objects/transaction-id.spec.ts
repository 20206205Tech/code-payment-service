import { TransactionId } from './transaction-id';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440001';

describe('TransactionId', () => {
  it('should create TransactionId with a valid UUID', () => {
    const id = new TransactionId(VALID_UUID);
    expect(id.value).toBe(VALID_UUID);
  });

  it('should throw for an invalid UUID', () => {
    expect(() => new TransactionId('')).toThrow('Invalid ID format');
  });

  it('TransactionId.create() should generate a valid UUID', () => {
    const id = TransactionId.create();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('two created TransactionIds should be unique', () => {
    const a = TransactionId.create();
    const b = TransactionId.create();
    expect(a.value).not.toBe(b.value);
  });
});
