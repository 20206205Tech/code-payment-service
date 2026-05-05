import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaymentCallbackController } from './payment-callback.controller';

describe('PaymentCallbackController', () => {
  let controller: PaymentCallbackController;
  const mockCommandBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<CommandBus>;
  const mockQueryBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<QueryBus>;

  beforeEach(() => {
    controller = new PaymentCallbackController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
