import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ArchivePlanController } from './archive-plan.controller';

describe('ArchivePlanController', () => {
  let controller: ArchivePlanController;
  const mockCommandBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<CommandBus>;
  const mockQueryBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<QueryBus>;

  beforeEach(() => {
    controller = new ArchivePlanController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
