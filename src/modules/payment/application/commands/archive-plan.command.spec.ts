import { ArchivePlanCommand } from './archive-plan.command';

const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

describe('ArchivePlanCommand', () => {
  it('should store planId', () => {
    const cmd = new ArchivePlanCommand(PLAN_UUID);
    expect(cmd.planId).toBe(PLAN_UUID);
  });
});
