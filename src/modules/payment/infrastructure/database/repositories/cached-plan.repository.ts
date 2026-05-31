import { Inject, Injectable } from '@nestjs/common';
import { CACHE_PORT } from '../../../application/ports/cache.port';
import type { CachePort } from '../../../application/ports/cache.port';
import { PlanRepositoryPort } from '../../../application/ports/database/plan.repository.port';
import { Plan } from '../../../domain/entities/plan';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { PlanEntity } from '../entities/plan.entity';
import { PlanMapper } from '../mappers/plan.mapper';
import { PlanOrmRepository } from './plan.orm-repository';

const ALL_ACTIVE_PLANS_CACHE_PREFIX = 'payment:plans:active';
const PLAN_BY_ID_CACHE_PREFIX = 'payment:plans:by-id';
const PLAN_CACHE_TTL_SECONDS = 3600;

type CachedPlanEntity = {
  id: string;
  name: string;
  features: string[];
  durationMonths: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
};

@Injectable()
export class CachedPlanRepository implements PlanRepositoryPort {
  constructor(
    private readonly planRepository: PlanOrmRepository,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
  ) {}

  async findById(id: PlanId): Promise<Plan | null> {
    const cacheKey = `${PLAN_BY_ID_CACHE_PREFIX}:${id.value}`;
    const cached = await this.cache.get<CachedPlanEntity>(cacheKey);
    if (cached) {
      return PlanMapper.toDomain(this.fromCache(cached));
    }

    const plan = await this.planRepository.findById(id);
    if (!plan) return null;

    await this.cache.set(cacheKey, this.toCache(plan), PLAN_CACHE_TTL_SECONDS);
    return plan;
  }

  async findAllActive(skip: number = 0, limit: number = 20): Promise<Plan[]> {
    const cacheKey = `${ALL_ACTIVE_PLANS_CACHE_PREFIX}:${skip}:${limit}`;
    const cached = await this.cache.get<CachedPlanEntity[]>(cacheKey);
    if (cached) {
      return cached.map((item) => PlanMapper.toDomain(this.fromCache(item)));
    }

    const plans = await this.planRepository.findAllActive(skip, limit);
    await this.cache.set(
      cacheKey,
      plans.map((plan) => this.toCache(plan)),
      PLAN_CACHE_TTL_SECONDS,
    );

    return plans;
  }

  async save(plan: Plan): Promise<void> {
    await this.planRepository.save(plan);
    await this.cache.delByPattern('payment:plans:*');
  }

  private toCache(plan: Plan): CachedPlanEntity {
    const orm = PlanMapper.toOrm(plan);
    return {
      id: orm.id,
      name: orm.name,
      features: orm.features,
      durationMonths: orm.durationMonths,
      price: Number(orm.price),
      isActive: orm.isActive,
      createdAt: orm.createdAt.toISOString(),
      updatedAt: orm.updatedAt.toISOString(),
      version: orm.version,
    };
  }

  private fromCache(cached: CachedPlanEntity): PlanEntity {
    const entity = new PlanEntity();
    entity.id = cached.id;
    entity.name = cached.name;
    entity.features = cached.features;
    entity.durationMonths = cached.durationMonths;
    entity.price = cached.price;
    entity.isActive = cached.isActive;
    entity.createdAt = new Date(cached.createdAt);
    entity.updatedAt = new Date(cached.updatedAt);
    entity.version = cached.version;
    return entity;
  }
}
