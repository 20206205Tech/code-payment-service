import { UserId } from '@20206205tech/nestjs-common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, EntityManager, LessThan, Not, Repository } from 'typeorm';
import { SubscriptionRepositoryPort } from '../../../application/ports/database/subscription.repository.port';
import { Subscription } from '../../../domain/entities/subscription';
import { SubscriptionPurchasedEvent } from '../../../domain/events/subscription-purchased.event';
import { SubscriptionId } from '../../../domain/value-objects/subscription-id';
import { SubscriptionStatus } from '../../../domain/value-objects/subscription-status';
import { OutboxEntity } from '../entities/outbox.entity';
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

  async findByUserId(userId: UserId): Promise<Subscription | null> {
    const orm = await this.repo.findOne({
      where: { userId: userId.value },
      order: { createdAt: 'DESC' },
    });
    return orm ? SubscriptionMapper.toDomain(orm) : null;
  }

  async findLatestActiveSubscription(
    userId: UserId,
  ): Promise<Subscription | null> {
    const orm = await this.repo.findOne({
      where: { userId: userId.value, status: SubscriptionStatus.ACTIVE },
      order: { periodEnd: 'DESC' },
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
        status: SubscriptionStatus.ACTIVE,
        id: Not(excludeId.value),
      },
    });
    for (const sub of others) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.repo.save(sub);
    }
  }

  async findActiveExpiringBefore(date: Date): Promise<Subscription[]> {
    const orms = await this.repo.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        periodEnd: LessThan(date),
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
        status: SubscriptionStatus.ACTIVE,
        periodEnd: Between(start, end),
      },
    });
    return orms.map((orm) => SubscriptionMapper.toDomain(orm));
  }

  async save(
    subscription: Subscription,
    context?: EntityManager,
  ): Promise<void> {
    const manager = context || this.repo.manager;
    const orm = SubscriptionMapper.toOrm(subscription);

    // Lưu Subscription và Outbox trong cùng một transaction
    await manager.save(orm);

    // Lấy các sự kiện chưa được commit từ Domain Aggregate
    const events = subscription.getUncommittedEvents();

    for (const event of events) {
      if (event instanceof SubscriptionPurchasedEvent) {
        const outbox = manager.create(OutboxEntity, {
          aggregateType: 'Subscription',
          aggregateId: subscription.subscriptionId.value,
          eventType: 'SubscriptionPurchasedEvent',
          payload: {
            subscriptionId: event.subscriptionId,
            userId: event.userId,
            planId: event.planId,
            periodStart: event.periodStart,
            periodEnd: event.periodEnd,
            version: event.version,
          },

          status: 'PENDING',
          retryCount: 0,
        });
        await manager.save(outbox);
      }
    }
  }

  async delete(id: SubscriptionId): Promise<void> {
    await this.repo.delete(id.value);
  }
}
