import { Plan } from '../../../domain/entities/plan';
import { Money } from '../../../domain/value-objects/money';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { PlanEntity } from '../entities/plan.entity';

export class PlanMapper {
  static toDomain(orm: PlanEntity): Plan {
    return Plan.reconstitute({
      id: new PlanId(orm.id),
      name: orm.name,
      durationMonths: orm.durationMonths,
      price: new Money(Number(orm.price)),
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      version: orm.version,
    });
  }

  static toOrm(domain: Plan): PlanEntity {
    const orm = new PlanEntity();
    orm.id = domain.planId.value;
    orm.name = domain.name;
    orm.durationMonths = domain.durationMonths;
    orm.price = domain.price.amount;
    orm.isActive = domain.isActive;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.version = domain.version.value;
    return orm;
  }
}
