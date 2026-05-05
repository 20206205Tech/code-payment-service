import { ManualActivateTransactionCommand } from './manual-activate-transaction.command';

const TXN_UUID = '44444444-4444-4444-8444-444444444444';

describe('ManualActivateTransactionCommand', () => {
  it('should store transactionId', () => {
    const cmd = new ManualActivateTransactionCommand(TXN_UUID);
    expect(cmd.transactionId).toBe(TXN_UUID);
  });
});
