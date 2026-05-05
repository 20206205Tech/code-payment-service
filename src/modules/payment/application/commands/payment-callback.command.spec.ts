import { PaymentCallbackCommand } from './payment-callback.command';

describe('PaymentCallbackCommand', () => {
  it('should store requestData and provider', () => {
    const data = { vnp_TxnRef: 'REF_001', vnp_Amount: '100000' };
    const cmd = new PaymentCallbackCommand(data, 'vnpay');
    expect(cmd.requestData).toEqual(data);
    expect(cmd.provider).toBe('vnpay');
  });
});
