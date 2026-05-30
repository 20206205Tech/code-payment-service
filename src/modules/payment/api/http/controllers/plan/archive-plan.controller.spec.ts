import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ArchivePlanController } from './archive-plan.controller';

describe('ArchivePlanController', () => {
  let controller: ArchivePlanController;
  const mockCommandBus: Pick<CommandBus, 'execute'> = {
    execute: jest.fn(),
  };
  const mockQueryBus: Pick<QueryBus, 'execute'> = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    controller = new ArchivePlanController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
