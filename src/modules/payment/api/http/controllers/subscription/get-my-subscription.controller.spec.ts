import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetMySubscriptionController } from './get-my-subscription.controller';

describe('GetMySubscriptionController', () => {
  let controller: GetMySubscriptionController;
  const mockCommandBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<CommandBus>;
  const mockQueryBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<QueryBus>;

  beforeEach(() => {
    controller = new GetMySubscriptionController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
