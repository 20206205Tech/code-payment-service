import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetAllPlanController } from './get-all-plan.controller';

describe('GetAllPlanController', () => {
  let controller: GetAllPlanController;
  const mockCommandBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<CommandBus>;
  const mockQueryBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<QueryBus>;

  beforeEach(() => {
    controller = new GetAllPlanController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
