import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetTransactionHistoryController } from './get-transaction-history.controller';

describe('GetTransactionHistoryController', () => {
  let controller: GetTransactionHistoryController;
  const mockCommandBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<CommandBus>;
  const mockQueryBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<QueryBus>;

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
