import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetDetailPlanController } from './get-detail-plan.controller';

describe('GetDetailPlanController', () => {
  let controller: GetDetailPlanController;
  const mockCommandBus: Pick<CommandBus, 'execute'> = {
    execute: jest.fn(),
  };
  const mockQueryBus: Pick<QueryBus, 'execute'> = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    controller = new GetDetailPlanController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
