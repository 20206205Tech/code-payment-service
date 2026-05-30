import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ManualActivateTransactionController } from './manual-activate-transaction.controller';

describe('ManualActivateTransactionController', () => {
  let controller: ManualActivateTransactionController;
  const mockCommandBus: Pick<CommandBus, 'execute'> = {
    execute: jest.fn(),
  };
  const mockQueryBus: Pick<QueryBus, 'execute'> = {
    execute: jest.fn(),
  };

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
