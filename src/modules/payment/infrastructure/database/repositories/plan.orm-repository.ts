import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanRepositoryPort } from '../../../application/ports/database/plan.repository.port';
import { Plan } from '../../../domain/entities/plan';
import { PlanId } from '../../../domain/value-objects/plan-id';
import { PlanEntity } from '../entities/plan.entity';
import { PlanMapper } from '../mappers/plan.mapper';

@Injectable()
export class PlanOrmRepository implements PlanRepositoryPort {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly repo: Repository<PlanEntity>,
  ) {}

  async findById(id: PlanId): Promise<Plan | null> {
    const orm = await this.repo.findOne({ where: { id: id.value } });
    return orm ? PlanMapper.toDomain(orm) : null;
  }

  async findAllActive(skip: number = 0, limit: number = 20): Promise<Plan[]> {
    const orms = await this.repo.find({
      where: { isActive: true },
      skip,
      take: limit,
      order: { price: 'ASC' },
    });
    return orms.map((orm) => PlanMapper.toDomain(orm));
  }

  async save(plan: Plan): Promise<void> {
    const orm = PlanMapper.toOrm(plan);
    await this.repo.save(orm);
  }
}
