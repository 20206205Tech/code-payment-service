import { PurchaseSubscriptionCommand } from './purchase-subscription.command';

const USER_UUID = '11111111-1111-1111-8111-111111111111';
const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

describe('PurchaseSubscriptionCommand', () => {
  it('should store all arguments', () => {
    const cmd = new PurchaseSubscriptionCommand(
      USER_UUID,
      'user@example.com',
      PLAN_UUID,
      '127.0.0.1',
      'https://example.com/redirect',
    );
    expect(cmd.userId).toBe(USER_UUID);
    expect(cmd.email).toBe('user@example.com');
    expect(cmd.planId).toBe(PLAN_UUID);
    expect(cmd.clientIp).toBe('127.0.0.1');
    expect(cmd.redirectUrl).toBe('https://example.com/redirect');
  });
});
