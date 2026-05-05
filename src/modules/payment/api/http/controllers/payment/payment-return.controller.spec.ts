import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaymentReturnController } from './payment-return.controller';

describe('PaymentReturnController', () => {
  let controller: PaymentReturnController;
  const mockCommandBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<CommandBus>;
  const mockQueryBus = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<QueryBus>;

  beforeEach(() => {
    controller = new PaymentReturnController(mockCommandBus, mockQueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
