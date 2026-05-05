import { TRANSACTION_REPOSITORY_PORT } from './transaction.repository.port';

describe('TransactionRepositoryPort', () => {
  it('TRANSACTION_REPOSITORY_PORT token should be a Symbol', () => {
    expect(typeof TRANSACTION_REPOSITORY_PORT).toBe('symbol');
    expect(TRANSACTION_REPOSITORY_PORT.toString()).toContain(
      'TRANSACTION_REPOSITORY_PORT',
    );
  });
});
