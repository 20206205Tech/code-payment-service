import { PLAN_REPOSITORY_PORT } from './plan.repository.port';

describe('PlanRepositoryPort', () => {
  it('PLAN_REPOSITORY_PORT token should be a Symbol', () => {
    expect(typeof PLAN_REPOSITORY_PORT).toBe('symbol');
    expect(PLAN_REPOSITORY_PORT.toString()).toContain('PLAN_REPOSITORY_PORT');
  });
});
