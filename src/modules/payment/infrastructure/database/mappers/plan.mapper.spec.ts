import { PlanMapper } from './plan.mapper';
import { Plan } from '../../../domain/entities/plan';
import { Money } from '../../../domain/value-objects/money';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { PlanEntity } from '../entities/plan.entity';

const PLAN_UUID = '22222222-2222-2222-8222-222222222222';

function makeOrmEntity(): PlanEntity {
  const e = new PlanEntity();
  e.id = PLAN_UUID;
  e.name = 'Pro Monthly';
  e.durationMonths = 1;
  e.price = 99000;
  e.isActive = true;
  e.createdAt = new Date('2024-01-01');
  e.updatedAt = new Date('2024-01-02');
  return e;
}

describe('PlanMapper', () => {
  describe('toDomain()', () => {
    it('should map ORM entity to domain Plan', () => {
      const orm = makeOrmEntity();
      const domain = PlanMapper.toDomain(orm);

      expect(domain).toBeInstanceOf(Plan);
      expect(domain.planId.value).toBe(PLAN_UUID);
      expect(domain.name).toBe('Pro Monthly');
      expect(domain.durationMonths).toBe(1);
      expect(domain.price.amount).toBe(99000);
      expect(domain.isActive).toBe(true);
    });

    it('should handle decimal price (TypeORM returns string for DECIMAL)', () => {
      const orm = makeOrmEntity();
      orm.price = '99000.00' as unknown as number; // TypeORM may return string
      const domain = PlanMapper.toDomain(orm);
      expect(domain.price.amount).toBe(99000);
    });
  });

  describe('toOrm()', () => {
    it('should map domain Plan to ORM entity', () => {
      const now = new Date();
      const domain = Plan.reconstitute({
        id: new PlanId(PLAN_UUID),
        name: 'Basic',
        durationMonths: 12,
        price: new Money(500000),
        isActive: false,
        createdAt: now,
        updatedAt: now,
        version: 1,
      });

      const orm = PlanMapper.toOrm(domain);

      expect(orm).toBeInstanceOf(PlanEntity);
      expect(orm.id).toBe(PLAN_UUID);
      expect(orm.name).toBe('Basic');
      expect(orm.durationMonths).toBe(12);
      expect(orm.price).toBe(500000);
      expect(orm.isActive).toBe(false);
    });
  });

  describe('roundtrip', () => {
    it('toDomain(toOrm(domain)) should produce equivalent domain object', () => {
      const original = Plan.create('Test', 3, new Money(200000), true);
      const orm = PlanMapper.toOrm(original);
      const restored = PlanMapper.toDomain(orm);

      expect(restored.name).toBe(original.name);
      expect(restored.durationMonths).toBe(original.durationMonths);
      expect(restored.price.amount).toBe(original.price.amount);
      expect(restored.isActive).toBe(original.isActive);
    });
  });
});
