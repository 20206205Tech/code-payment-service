import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PurchaseSubscriptionController } from './purchase-subscription.controller';

describe('PurchaseSubscriptionController', () => {
  let controller: PurchaseSubscriptionController;
  const mockCommandBus: Pick<CommandBus, 'execute'> = {
    execute: jest.fn(),
  };
  const mockQueryBus: Pick<QueryBus, 'execute'> = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    controller = new PurchaseSubscriptionController(
      mockCommandBus,
      mockQueryBus,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
