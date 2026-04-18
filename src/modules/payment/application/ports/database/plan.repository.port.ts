import { Plan } from '../../../domain/entities/plan';
import { PlanId } from '../../../domain/value-objects/plan-id';

export const PLAN_REPOSITORY_PORT = Symbol('PLAN_REPOSITORY_PORT');

export interface PlanRepositoryPort {
  findById(id: PlanId): Promise<Plan | null>;
  findAllActive(skip?: number, limit?: number): Promise<Plan[]>;
  save(plan: Plan): Promise<void>;
}
