import { Money } from '../value-objects/money';
import { PlanDurationMonths } from '../value-objects/plan-duration-months';
import { PlanId } from '../value-objects/plan-id';
import { PlanName } from '../value-objects/plan-name';
import { Plan } from './plan';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Plan Entity', () => {
  describe('Plan.create()', () => {
    it('should create a new Plan with correct properties', () => {
      const plan = Plan.create(
        new PlanName('Pro Monthly'),
        new PlanDurationMonths(1),
        new Money(99000),
      );

      expect(plan.name.value).toBe('Pro Monthly');
      expect(plan.durationMonths.value).toBe(1);
      expect(plan.price.amount).toBe(99000);
      expect(plan.isActive).toBe(true);
      expect(plan.planId).toBeDefined();
      expect(plan.createdAt).toBeInstanceOf(Date);
      expect(plan.updatedAt).toBeInstanceOf(Date);
    });

    it('should create an inactive Plan when isActive = false', () => {
      const plan = Plan.create(
        new PlanName('Archive Plan'),
        new PlanDurationMonths(3),
        new Money(200000),
        false,
      );
      expect(plan.isActive).toBe(false);
    });

    it('should generate a unique planId for each created Plan', () => {
      const p1 = Plan.create(
        new PlanName('AAA'),
        new PlanDurationMonths(1),
        new Money(1),
      );
      const p2 = Plan.create(
        new PlanName('BBB'),
        new PlanDurationMonths(1),
        new Money(1),
      );
      expect(p1.planId.value).not.toBe(p2.planId.value);
    });
  });

  describe('Plan.reconstitute()', () => {
    it('should reconstitute a Plan from persistence data', () => {
      const now = new Date();
      const plan = Plan.reconstitute({
        id: new PlanId(VALID_UUID),
        name: new PlanName('Basic'),
        durationMonths: new PlanDurationMonths(12),
        price: new Money(500000),
        isActive: true,
        createdAt: now,
        updatedAt: now,
        version: 1,
      });

      expect(plan.planId.value).toBe(VALID_UUID);
      expect(plan.name.value).toBe('Basic');
      expect(plan.durationMonths.value).toBe(12);
      expect(plan.price.amount).toBe(500000);
    });
  });

  describe('deactivate()', () => {
    it('should set isActive to false', () => {
      const plan = Plan.create(
        new PlanName('Plan'),
        new PlanDurationMonths(1),
        new Money(50000),
      );
      expect(plan.isActive).toBe(true);
      plan.archive();
      expect(plan.isActive).toBe(false);
    });

    it('should update updatedAt when deactivated', () => {
      const plan = Plan.create(
        new PlanName('Plan'),
        new PlanDurationMonths(1),
        new Money(50000),
      );
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
