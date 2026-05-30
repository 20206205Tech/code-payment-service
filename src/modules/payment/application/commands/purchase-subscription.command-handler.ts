import { BaseCommandHandler } from '@20206205tech/nestjs-common';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler } from '@nestjs/cqrs';
import { PlanNotFoundException } from '../../domain/exceptions/plan-not-found.exception';

import { UserId } from '@20206205tech/nestjs-common';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { TransactionFactory } from '../../domain/factories/transaction.factory';
import {
  PAYMENT_QUEUE,
  PAYMENT_TIMEOUT_MS,
  PAYMENT_TIMEOUT_QUEUE,
} from '../../domain/value-objects/constants';
import { Money } from '../../domain/value-objects/money';
import { PlanId } from '../../domain/value-objects/plan-id';
import { PaymentDomainService } from '../../domain/services/payment.domain-service';
import {
  PLAN_REPOSITORY_PORT,
  type PlanRepositoryPort,
} from '../ports/database/plan.repository.port';
import {
  SUBSCRIPTION_REPOSITORY_PORT,
  type SubscriptionRepositoryPort,
} from '../ports/database/subscription.repository.port';
import {
  TRANSACTION_REPOSITORY_PORT,
  type TransactionRepositoryPort,
} from '../ports/database/transaction.repository.port';
import {
  PAYMENT_GATEWAY_PORT,
  type PaymentGatewayPort,
} from '../ports/payment/payment-gateway.port';
import { PurchaseSubscriptionCommand } from './purchase-subscription.command';

@CommandHandler(PurchaseSubscriptionCommand)
export class PurchaseSubscriptionCommandHandler extends BaseCommandHandler<
  PurchaseSubscriptionCommand,
  string
> {
  constructor(
    @Inject(PLAN_REPOSITORY_PORT)
    private readonly planRepository: PlanRepositoryPort,
    @Inject(SUBSCRIPTION_REPOSITORY_PORT)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort,
    @InjectQueue(PAYMENT_QUEUE)
    private readonly paymentQueue: Queue,
    private readonly configService: ConfigService,
    private readonly paymentDomainService: PaymentDomainService,
  ) {
    super();
  }

  async execute(command: PurchaseSubscriptionCommand): Promise<string> {
    const userId = new UserId(command.userId);
    const planId = new PlanId(command.planId);

    // 1. Validate plan
    const plan = await this.planRepository.findById(planId);
    if (!plan || !plan.isActive) {
      throw new PlanNotFoundException(planId.value);
    }

    // 2. Chuẩn bị subscription (tạo mới hoặc tái sử dụng) - DOMAIN LOGIC
    const existingSubscription =
      await this.subscriptionRepository.findByUserId(userId);

    const { subscription, isNew } =
      this.paymentDomainService.prepareSubscriptionForPurchase(
        existingSubscription,
        userId,
        planId,
        plan,
      );

    // 3. Lưu subscription nếu mới tạo
    if (isNew) {
      await this.subscriptionRepository.save(subscription);
    }

    // 4. Tạo transaction reference
    const now = new Date();
    const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const txnRef = `${yymmdd}_${uuidv4().slice(0, 6).toUpperCase()}`;

    const defaultProvider = this.configService.get<string>(
      'PAYMENT_DEFAULT_PROVIDER',
      'vnpay',
    );

    // 5. Tạo transaction
    const transaction = TransactionFactory.create(
      userId,
      subscription.subscriptionId,
      planId,
      plan.price,
      new Money(0), // discountAmount
      plan.price, // finalAmount
      txnRef,
      defaultProvider,
      {
        customer_email: command.email,
        redirect_url: command.redirectUrl,
      },
    );
    await this.transactionRepository.save(transaction);

    // 6. Thêm job timeout vào queue
    const timeoutMs = PAYMENT_TIMEOUT_MS;
    await this.paymentQueue.add(
      PAYMENT_TIMEOUT_QUEUE,
      { transactionId: transaction.transactionId.value },
      { delay: timeoutMs },
    );

    // 7. Tạo payment URL
    try {
      return await this.paymentGateway.createPaymentUrl({
        txn_ref: txnRef,
        amount: plan.price.amount,
        description: `Thanh toan dang ky: ${plan.name.value} #${txnRef}`,
        client_ip: command.clientIp,
        user_id: command.userId,
        provider: defaultProvider,
      });
    } catch (error: unknown) {
      // Rollback: xóa transaction và subscription nếu vừa tạo mới
      await this.transactionRepository.delete(transaction.transactionId);
      if (isNew) {
        await this.subscriptionRepository.delete(subscription.subscriptionId);
      }
      throw new InternalServerErrorException(String(error));
    }
  }
}
