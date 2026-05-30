import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetMySubscriptionController } from './get-my-subscription.controller';

describe('GetMySubscriptionController', () => {
  let controller: GetMySubscriptionController;
  const mockCommandBus: Pick<CommandBus, 'execute'> = {
    execute: jest.fn(),
  };
  const mockQueryBus: Pick<QueryBus, 'execute'> = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    controller = new GetMySubscriptionController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
