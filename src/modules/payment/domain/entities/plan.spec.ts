import { Money } from '../value-objects/money';
import { PlanId } from '../value-objects/plan-id';
import { Plan } from './plan';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Plan Entity', () => {
  describe('Plan.create()', () => {
    it('should create a new Plan with correct properties', () => {
      const plan = Plan.create('Pro Monthly', 1, new Money(99000));

      expect(plan.name).toBe('Pro Monthly');
      expect(plan.durationMonths).toBe(1);
      expect(plan.price.amount).toBe(99000);
      expect(plan.isActive).toBe(true);
      expect(plan.planId).toBeDefined();
      expect(plan.createdAt).toBeInstanceOf(Date);
      expect(plan.updatedAt).toBeInstanceOf(Date);
    });

    it('should create an inactive Plan when isActive = false', () => {
      const plan = Plan.create('Archive Plan', 3, new Money(200000), false);
      expect(plan.isActive).toBe(false);
    });

    it('should generate a unique planId for each created Plan', () => {
      const p1 = Plan.create('A', 1, new Money(1));
      const p2 = Plan.create('B', 1, new Money(1));
      expect(p1.planId.value).not.toBe(p2.planId.value);
    });
  });

  describe('Plan.reconstitute()', () => {
    it('should reconstitute a Plan from persistence data', () => {
      const now = new Date();
      const plan = Plan.reconstitute({
        id: new PlanId(VALID_UUID),
        name: 'Basic',
        durationMonths: 12,
        price: new Money(500000),
        isActive: true,
        createdAt: now,
        updatedAt: now,
        version: 1,
      });

      expect(plan.planId.value).toBe(VALID_UUID);
      expect(plan.name).toBe('Basic');
      expect(plan.durationMonths).toBe(12);
      expect(plan.price.amount).toBe(500000);
    });
  });

  describe('deactivate()', () => {
    it('should set isActive to false', () => {
      const plan = Plan.create('Plan', 1, new Money(50000));
      expect(plan.isActive).toBe(true);
      plan.archive();
      expect(plan.isActive).toBe(false);
    });

    it('should update updatedAt when deactivated', () => {
      const plan = Plan.create('Plan', 1, new Money(50000));
      const before = plan.updatedAt;
      // Ensure time passes
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);
      plan.archive();
      expect(plan.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      jest.useRealTimers();
    });
  });
});
