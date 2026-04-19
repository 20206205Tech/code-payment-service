import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Not, Repository } from 'typeorm';
import { SubscriptionRepositoryPort } from '../../../application/ports/database/subscription.repository.port';
import { Subscription } from '../../../domain/entities/subscription';
import { SubscriptionId } from '../../../domain/value-objects/subscription-id';
import { UserId } from '../../../domain/value-objects/user-id';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { SubscriptionMapper } from '../mappers/subscription.mapper';

@Injectable()
export class SubscriptionOrmRepository implements SubscriptionRepositoryPort {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repo: Repository<SubscriptionEntity>,
  ) {}

  async findById(id: SubscriptionId): Promise<Subscription | null> {
    const orm = await this.repo.findOne({ where: { id: id.value } });
    return orm ? SubscriptionMapper.toDomain(orm) : null;
  }

  async findActiveByUserId(userId: UserId): Promise<Subscription | null> {
    const orm = await this.repo.findOne({
      where: { userId: userId.value, status: 'active' },
      order: { endDate: 'DESC' },
    });
    return orm ? SubscriptionMapper.toDomain(orm) : null;
  }

  async isFirstPurchase(userId: UserId): Promise<boolean> {
    const count = await this.repo.count({ where: { userId: userId.value } });
    return count === 0;
  }

  async deactivateOtherSubscriptions(
    userId: UserId,
    excludeId: SubscriptionId,
  ): Promise<void> {
    const others = await this.repo.find({
      where: {
        userId: userId.value,
        status: 'active',
        id: Not(excludeId.value),
      },
    });
    for (const sub of others) {
      sub.status = 'expired';
      await this.repo.save(sub);
    }
  }

  async findActiveExpiringBefore(date: Date): Promise<Subscription[]> {
    const orms = await this.repo.find({
      where: {
        status: 'active',
        endDate: LessThan(date),
      },
    });
    return orms.map((orm) => SubscriptionMapper.toDomain(orm));
  }

  async findActiveExpiringBetween(
    start: Date,
    end: Date,
  ): Promise<Subscription[]> {
    const orms = await this.repo.find({
      where: {
        status: 'active',
        endDate: Between(start, end),
      },
    });
    return orms.map((orm) => SubscriptionMapper.toDomain(orm));
  }

  async save(subscription: Subscription): Promise<void> {
    const orm = SubscriptionMapper.toOrm(subscription);
    await this.repo.save(orm);
  }

  async delete(id: SubscriptionId): Promise<void> {
    await this.repo.delete(id.value);
  }
}
