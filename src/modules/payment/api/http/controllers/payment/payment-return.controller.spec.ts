import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaymentReturnController } from './payment-return.controller';

describe('PaymentReturnController', () => {
  let controller: PaymentReturnController;
  const mockCommandBus: Pick<CommandBus, 'execute'> = {
    execute: jest.fn(),
  };
  const mockQueryBus: Pick<QueryBus, 'execute'> = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    controller = new PaymentReturnController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
