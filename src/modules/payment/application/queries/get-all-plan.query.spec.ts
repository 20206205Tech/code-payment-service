import { GetAllPlanQuery } from './get-all-plan.query';

describe('GetAllPlanQuery', () => {
  it('should store skip and limit', () => {
    const q = new GetAllPlanQuery(10, 5);
    expect(q.skip).toBe(10);
    expect(q.limit).toBe(5);
  });

  it('should default skip=0 and limit=100', () => {
    const q = new GetAllPlanQuery();
    expect(q.skip).toBe(0);
    expect(q.limit).toBe(100);
  });
});
