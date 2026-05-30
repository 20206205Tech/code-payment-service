import { Plan } from '../entities/plan';
import { Money } from '../value-objects/money';
import { PlanDurationMonths } from '../value-objects/plan-duration-months';
import { PlanName } from '../value-objects/plan-name';
import { PlanFactory } from './plan.factory';

describe('PlanFactory', () => {
  describe('create()', () => {
    it('should create a Plan instance', () => {
      const plan = PlanFactory.create(
        new PlanName('Pro'),
        new PlanDurationMonths(1),
        new Money(99000),
      );
      expect(plan).toBeInstanceOf(Plan);
    });

    it('should set all fields correctly', () => {
      const plan = PlanFactory.create(
        new PlanName('Premium'),
        new PlanDurationMonths(3),
        new Money(250000),
        true,
      );
      expect(plan.name.value).toBe('Premium');
      expect(plan.durationMonths.value).toBe(3);
      expect(plan.price.amount).toBe(250000);
      expect(plan.isActive).toBe(true);
    });

    it('should default isActive = true when not specified', () => {
      const plan = PlanFactory.create(
        new PlanName('Basic'),
        new PlanDurationMonths(6),
        new Money(100000),
      );
      expect(plan.isActive).toBe(true);
    });

    it('should create inactive plan when isActive = false', () => {
      const plan = PlanFactory.create(
        new PlanName('Old'),
        new PlanDurationMonths(12),
        new Money(300000),
        false,
      );
      expect(plan.isActive).toBe(false);
    });

    it('should generate a planId', () => {
      const plan = PlanFactory.create(
        new PlanName('Xxx'),
        new PlanDurationMonths(1),
        new Money(1),
      );
      expect(plan.planId.value).toBeDefined();
      expect(plan.planId.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });
});
