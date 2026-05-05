import { CreatePlanCommand } from './create-plan.command';

describe('CreatePlanCommand', () => {
  it('should store name, durationMonths, price', () => {
    const cmd = new CreatePlanCommand('Pro', 1, 99000);
    expect(cmd.name).toBe('Pro');
    expect(cmd.durationMonths).toBe(1);
    expect(cmd.price).toBe(99000);
  });
});
