import { Inject } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '../../../common/application/commands/base.command-handler';
import { Plan } from '../../domain/entities/plan';
import { Money } from '../../domain/value-objects/money';
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
    const price = new Money(command.price);
    // 🟢 Khởi tạo Plan thuần túy
    const plan = Plan.create(
      command.name,
      command.durationMonths,
      price,
      command.isActive,
    );

    // 🟢 Lưu trực tiếp xuống Port
    await this.planRepository.save(plan);

    return plan;
  }
}
