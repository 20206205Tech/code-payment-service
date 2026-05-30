import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetAllPlanController } from './get-all-plan.controller';

describe('GetAllPlanController', () => {
  let controller: GetAllPlanController;
  const mockCommandBus: Pick<CommandBus, 'execute'> = {
    execute: jest.fn(),
  };
  const mockQueryBus: Pick<QueryBus, 'execute'> = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    controller = new GetAllPlanController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
