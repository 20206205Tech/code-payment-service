import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePlanController } from './create-plan.controller';

describe('CreatePlanController', () => {
  let controller: CreatePlanController;
  const mockCommandBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<CommandBus>;
  const mockQueryBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<QueryBus>;

  beforeEach(() => {
    controller = new CreatePlanController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
