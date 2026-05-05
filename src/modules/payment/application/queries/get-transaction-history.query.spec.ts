import { GetTransactionHistoryQuery } from './get-transaction-history.query';

describe('GetTransactionHistoryQuery', () => {
  it('should store userId, skip, limit', () => {
    const q = new GetTransactionHistoryQuery(
      '11111111-1111-1111-1111-111111111111',
      5,
      10,
    );
    expect(q.userId).toBe('11111111-1111-1111-1111-111111111111');
    expect(q.skip).toBe(5);
    expect(q.limit).toBe(10);
  });

  it('should default skip=0 and limit=20', () => {
    const q = new GetTransactionHistoryQuery(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(q.skip).toBe(0);
    expect(q.limit).toBe(20);
  });
});
