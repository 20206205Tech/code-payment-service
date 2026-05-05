import { GetDetailPlanQuery } from './get-detail-plan.query';

describe('GetDetailPlanQuery', () => {
  it('should store planId', () => {
    const q = new GetDetailPlanQuery('550e8400-e29b-41d4-a716-446655440000');
    expect(q.planId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
});
