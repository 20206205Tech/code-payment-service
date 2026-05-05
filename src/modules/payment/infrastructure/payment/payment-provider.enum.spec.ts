import { PaymentProvider } from './payment-provider.enum';

describe('PaymentProvider', () => {
  it('should have defined values', () => {
    expect(PaymentProvider.MOMO).toBe('momo');
    expect(PaymentProvider.VNPAY).toBe('vnpay');
    expect(PaymentProvider.ZALOPAY).toBe('zalopay');
    expect(PaymentProvider.SEPAY).toBe('sepay');
  });
});
