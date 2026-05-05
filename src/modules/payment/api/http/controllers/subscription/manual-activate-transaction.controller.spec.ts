import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ManualActivateTransactionController } from './manual-activate-transaction.controller';

describe('ManualActivateTransactionController', () => {
  let controller: ManualActivateTransactionController;
  const mockCommandBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<CommandBus>;
  const mockQueryBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<QueryBus>;

  beforeEach(() => {
    controller = new ManualActivateTransactionController(
      mockCommandBus,
      mockQueryBus,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
