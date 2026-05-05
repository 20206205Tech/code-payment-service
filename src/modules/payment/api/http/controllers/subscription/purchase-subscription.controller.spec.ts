import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PurchaseSubscriptionController } from './purchase-subscription.controller';

describe('PurchaseSubscriptionController', () => {
  let controller: PurchaseSubscriptionController;
  const mockCommandBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<CommandBus>;
  const mockQueryBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<QueryBus>;

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
