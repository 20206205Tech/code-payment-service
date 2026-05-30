import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePlanController } from './create-plan.controller';

describe('CreatePlanController', () => {
  let controller: CreatePlanController;
  const mockCommandBus: Pick<CommandBus, 'execute'> = {
    execute: jest.fn(),
  };
  const mockQueryBus: Pick<QueryBus, 'execute'> = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    controller = new CreatePlanController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
