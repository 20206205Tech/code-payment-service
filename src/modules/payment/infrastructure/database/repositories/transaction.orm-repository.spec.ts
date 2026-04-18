import { TransactionOrmRepository } from './transaction.orm-repository';

describe('TransactionOrmRepository', () => {
  it('should be defined', () => {
    expect(new TransactionOrmRepository()).toBeDefined();
  });
});
