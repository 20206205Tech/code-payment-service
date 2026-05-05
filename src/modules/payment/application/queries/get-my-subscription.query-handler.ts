import { Inject } from '@nestjs/common';
import { QueryHandler } from '@nestjs/cqrs';
import { BaseQueryHandler, UserId } from '@20206205tech/nestjs-common';

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
export class GetMySubscriptionQueryHandler extends BaseQueryHandler<
  GetMySubscriptionQuery,
  MySubscriptionResponse
> {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY_PORT)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
  ) {
    super();
  }

  async execute(
    query: GetMySubscriptionQuery,
  ): Promise<MySubscriptionResponse> {
    const userId = new UserId(query.userId);
    const now = new Date();

    const allActive =
      await this.subscriptionRepository.findAllActiveByUserId(userId);

    // Tìm gói hiện đang chạy (now nằm trong khoảng start và end)
    const currentSubscription = allActive.find(
      (sub) => sub.startDate <= now && sub.endDate >= now,
    );

    // Nếu không có gói nào đang chạy nhưng có gói trong tương lai (đã stack)
    // thì lấy gói sẽ bắt đầu sớm nhất
    const subscription =
      currentSubscription ||
      (allActive.length > 0 ? allActive[allActive.length - 1] : null);

    if (!subscription || (subscription.endDate < now && !currentSubscription)) {
      return {
        subscription: null,
        has_active_subscription: false,
        days_remaining: null,
      };
    }

    // Tính tổng số ngày còn lại dựa trên ngày kết thúc của gói xa nhất
    const latestEndDate = allActive.reduce((latest, sub) => {
      return sub.endDate > latest ? sub.endDate : latest;
    }, subscription.endDate);

    const daysRemaining = Math.ceil(
      (latestEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
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
