import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetDetailPlanController } from './get-detail-plan.controller';

describe('GetDetailPlanController', () => {
  let controller: GetDetailPlanController;
  const mockCommandBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<CommandBus>;
  const mockQueryBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<QueryBus>;

  beforeEach(() => {
    controller = new GetDetailPlanController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
