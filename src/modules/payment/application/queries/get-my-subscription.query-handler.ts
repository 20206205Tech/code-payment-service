import { Inject } from '@nestjs/common';
import { QueryHandler } from '@nestjs/cqrs';
import { BaseQueryHandler, UserId } from '@20206205tech/nestjs-common';

import {
  SUBSCRIPTION_REPOSITORY_PORT,
  type SubscriptionRepositoryPort,
} from '../ports/database/subscription.repository.port';
import { GetMySubscriptionQuery } from './get-my-subscription.query';
import { PaymentDomainService } from '../../domain/services/payment.domain-service';

export interface MySubscriptionResponse {
  has_active_subscription: boolean;
}

@QueryHandler(GetMySubscriptionQuery)
export class GetMySubscriptionQueryHandler extends BaseQueryHandler<
  GetMySubscriptionQuery,
  MySubscriptionResponse
> {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY_PORT)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    private readonly paymentDomainService: PaymentDomainService,
  ) {
    super();
  }

  async execute(
    query: GetMySubscriptionQuery,
  ): Promise<MySubscriptionResponse> {
    const userId = new UserId(query.userId);

    // 1 user = 1 subscription duy nhất — lấy trực tiếp
    const subscription = await this.subscriptionRepository.findByUserId(userId);

    // Sử dụng domain service để kiểm tra logic nghiệp vụ
    const hasActive =
      this.paymentDomainService.hasActiveSubscription(subscription);

    return { has_active_subscription: hasActive };
  }
}
