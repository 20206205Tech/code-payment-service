import { PlanNotFoundException } from './plan-not-found.exception';

describe('PlanNotFoundException', () => {
  it('should create with message including plan ID', () => {
    const id = 'PLAN_123';
    const exception = new PlanNotFoundException(id);
    expect(exception.message).toContain(id);
    expect(exception.message).toContain('không tồn tại');
  });
});
