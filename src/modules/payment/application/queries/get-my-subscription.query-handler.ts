import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserId } from '../../domain/value-objects/user-id';
import {
  SUBSCRIPTION_REPOSITORY_PORT,
  type SubscriptionRepositoryPort,
} from '../ports/database/subscription.repository.port';
import { GetMySubscriptionQuery } from './get-my-subscription.query';

export interface MySubscriptionResponse {
  subscription: {
    id: string;
    user_id: string;
    plan_id: string;
    start_date: Date;
    end_date: Date;
    status: string;
    created_at: Date;
  } | null;
  has_active_subscription: boolean;
  days_remaining: number | null;
}

@QueryHandler(GetMySubscriptionQuery)
export class GetMySubscriptionQueryHandler implements IQueryHandler<GetMySubscriptionQuery> {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY_PORT)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
  ) {}

  async execute(
    query: GetMySubscriptionQuery,
  ): Promise<MySubscriptionResponse> {
    const userId = new UserId(query.userId);
    const subscription =
      await this.subscriptionRepository.findActiveByUserId(userId);

    if (!subscription || subscription.endDate < new Date()) {
      return {
        subscription: null,
        has_active_subscription: false,
        days_remaining: null,
      };
    }

    const daysRemaining = Math.ceil(
      (subscription.endDate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      subscription: {
        id: subscription.subscriptionId.value,
        user_id: subscription.userId.value,
        plan_id: subscription.planId.value,
        start_date: subscription.startDate,
        end_date: subscription.endDate,
        status: subscription.status,
        created_at: subscription.createdAt,
      },
      has_active_subscription: true,
      days_remaining: daysRemaining,
    };
  }
}
