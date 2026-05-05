import { Inject } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@20206205tech/nestjs-common';
import { Plan } from '../../domain/entities/plan';
import { Money } from '../../domain/value-objects/money';
import { PlanFactory } from '../../domain/factories/plan.factory';
import {
  PLAN_REPOSITORY_PORT,
  type PlanRepositoryPort,
} from '../ports/database/plan.repository.port';
import { CreatePlanCommand } from './create-plan.command';

@CommandHandler(CreatePlanCommand)
export class CreatePlanCommandHandler extends BaseCommandHandler<
  CreatePlanCommand,
  Plan
> {
  constructor(
    @Inject(PLAN_REPOSITORY_PORT)
    private readonly planRepository: PlanRepositoryPort,
  ) {
    super();
  }

  async execute(command: CreatePlanCommand): Promise<Plan> {
    const plan = PlanFactory.create(
      command.name,
      command.durationMonths,
      new Money(command.price),
      command.isActive,
    );

    await this.planRepository.save(plan);
    return plan;
  }
}
