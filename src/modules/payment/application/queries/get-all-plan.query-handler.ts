import { BaseQueryHandler } from '@20206205tech/nestjs-common';
import { Inject } from '@nestjs/common';
import { QueryHandler } from '@nestjs/cqrs';
import {
  PLAN_REPOSITORY_PORT,
  type PlanRepositoryPort,
} from '../ports/database/plan.repository.port';
import { GetAllPlanQuery } from './get-all-plan.query';

export interface PlanResponseItem {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
}

@QueryHandler(GetAllPlanQuery)
export class GetAllPlanQueryHandler extends BaseQueryHandler<GetAllPlanQuery> {
  constructor(
    @Inject(PLAN_REPOSITORY_PORT)
    private readonly planRepository: PlanRepositoryPort,
  ) {
    super();
  }

  async execute(query: GetAllPlanQuery): Promise<PlanResponseItem[]> {
    const plans = await this.planRepository.findAllActive(
      query.skip,
      query.limit,
    );
    return plans.map((p) => ({
      id: p.planId.value,
      name: p.name.value,
      durationMonths: p.durationMonths.value,
      price: p.price.amount,
      features: p.features,
      isActive: p.isActive,
      createdAt: p.createdAt,
    }));
  }
}
