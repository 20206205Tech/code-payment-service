import { PaymentFailedException } from './payment-failed.exception';

describe('PaymentFailedException', () => {
  it('should be defined', () => {
    expect(new PaymentFailedException()).toBeDefined();
  });
});
