import { Inject } from '@nestjs/common';
import { PlanNotFoundException } from '../../domain/exceptions/plan-not-found.exception';
import { QueryHandler } from '@nestjs/cqrs';
import { BaseQueryHandler } from '@20206205tech/nestjs-common';
import { PlanId } from '../../domain/value-objects/plan-id';
import {
  PLAN_REPOSITORY_PORT,
  type PlanRepositoryPort,
} from '../ports/database/plan.repository.port';
import { GetDetailPlanQuery } from './get-detail-plan.query';
import { type PlanResponseItem } from './get-all-plan.query-handler';

@QueryHandler(GetDetailPlanQuery)
export class GetDetailPlanQueryHandler extends BaseQueryHandler<GetDetailPlanQuery> {
  constructor(
    @Inject(PLAN_REPOSITORY_PORT)
    private readonly planRepository: PlanRepositoryPort,
  ) {
    super();
  }

  async execute(query: GetDetailPlanQuery): Promise<PlanResponseItem> {
    const planId = new PlanId(query.planId);
    const plan = await this.planRepository.findById(planId);
    if (!plan) throw new PlanNotFoundException(planId.value);
    return {
      id: plan.planId.value,
      name: plan.name,
      durationMonths: plan.durationMonths,
      price: plan.price.amount,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
    };
  }
}
