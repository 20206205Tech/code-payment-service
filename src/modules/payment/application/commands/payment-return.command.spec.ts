import { PaymentReturnCommand } from './payment-return.command';

describe('PaymentReturnCommand', () => {
  it('should store queryParams and provider', () => {
    const params = { vnp_TxnRef: 'REF_002' };
    const cmd = new PaymentReturnCommand(params, 'vnpay');
    expect(cmd.queryParams).toEqual(params);
    expect(cmd.provider).toBe('vnpay');
  });
});
