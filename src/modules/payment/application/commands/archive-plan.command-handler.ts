import { Inject } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@20206205tech/nestjs-common';
import { PlanId } from '../../domain/value-objects/plan-id';
import {
  PLAN_REPOSITORY_PORT,
  type PlanRepositoryPort,
} from '../ports/database/plan.repository.port';
import { PlanNotFoundException } from '../../domain/exceptions/plan-not-found.exception';
import { ArchivePlanCommand } from './archive-plan.command'; // Lưu ý tên Command class

@CommandHandler(ArchivePlanCommand)
export class ArchivePlanCommandHandler extends BaseCommandHandler<
  ArchivePlanCommand,
  void
> {
  constructor(
    @Inject(PLAN_REPOSITORY_PORT)
    private readonly planRepository: PlanRepositoryPort,
  ) {
    super();
  }

  async execute(command: ArchivePlanCommand): Promise<void> {
    const planId = new PlanId(command.planId);
    const plan = await this.planRepository.findById(planId);

    if (!plan) throw new PlanNotFoundException(command.planId);

    plan.archive();

    await this.planRepository.save(plan);
  }
}
