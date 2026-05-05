import { PaymentStatus } from './payment-status';

describe('PaymentStatus', () => {
  it('should have correct enum values', () => {
    expect(PaymentStatus.PENDING).toBe('pending');
    expect(PaymentStatus.SUCCESS).toBe('success');
    expect(PaymentStatus.FAILED).toBe('failed');
    expect(PaymentStatus.EXPIRED).toBe('expired');
  });
});
