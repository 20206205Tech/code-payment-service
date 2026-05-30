import { Plan } from '../../../domain/entities/plan';
import { Money } from '../../../domain/value-objects/money';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { PlanDurationMonths } from '../../../domain/value-objects/plan-duration-months';
import { PlanName } from '../../../domain/value-objects/plan-name';
import { PlanEntity } from '../entities/plan.entity';

export class PlanMapper {
  static toDomain(orm: PlanEntity): Plan {
    return Plan.reconstitute({
      id: new PlanId(orm.id),
      name: new PlanName(orm.name),
      durationMonths: new PlanDurationMonths(orm.durationMonths),
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
    orm.name = domain.name.value;
    orm.durationMonths = domain.durationMonths.value;
    orm.price = domain.price.amount;
    orm.isActive = domain.isActive;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.version = domain.version.value;
    return orm;
  }
}
