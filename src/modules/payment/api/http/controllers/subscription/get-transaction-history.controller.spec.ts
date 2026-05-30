import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetTransactionHistoryController } from './get-transaction-history.controller';

describe('GetTransactionHistoryController', () => {
  let controller: GetTransactionHistoryController;
  const mockCommandBus: Pick<CommandBus, 'execute'> = {
    execute: jest.fn(),
  };
  const mockQueryBus: Pick<QueryBus, 'execute'> = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    controller = new GetTransactionHistoryController(
      mockCommandBus,
      mockQueryBus,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
