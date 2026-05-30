import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaymentCallbackController } from './payment-callback.controller';

describe('PaymentCallbackController', () => {
  let controller: PaymentCallbackController;
  const mockCommandBus: Pick<CommandBus, 'execute'> = {
    execute: jest.fn(),
  };
  const mockQueryBus: Pick<QueryBus, 'execute'> = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    controller = new PaymentCallbackController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
