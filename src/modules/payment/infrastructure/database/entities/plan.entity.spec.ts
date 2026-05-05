import { PlanEntity } from './plan.entity';

describe('PlanEntity', () => {
  it('should be able to create a new instance', () => {
    const entity = new PlanEntity();
    entity.id = 'plan-123';
    entity.name = 'Pro Plan';
    entity.isActive = true;

    expect(entity.id).toBe('plan-123');
    expect(entity.isActive).toBe(true);
  });
});
