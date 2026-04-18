import { InjectQueue } from '@nestjs/bullmq';
import {
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Queue } from 'bullmq';
import { addMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { PAYMENT_QUEUE, PAYMENT_TIMEOUT_JOB } from '../../constants';
import { Subscription } from '../../domain/entities/subscription';
import { Transaction } from '../../domain/entities/transaction';
import { Money } from '../../domain/value-objects/money';
import { PlanId } from '../../domain/value-objects/plan-id';
import { UserId } from '../../domain/value-objects/user-id';
import { PaymentGatewaySelectorService } from '../../infrastructure/payment/payment-gateway-selector.service';
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
export class PurchaseSubscriptionCommandHandler implements ICommandHandler<PurchaseSubscriptionCommand> {
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
  ) {}

  async execute(command: PurchaseSubscriptionCommand): Promise<string> {
    const planId = new PlanId(command.planId);
    const userId = new UserId(command.userId);

    const plan = await this.planRepository.findById(planId);
    if (!plan || !plan.isActive)
      throw new NotFoundException(
        'Gối dịch vụ không tồn tại hoặc đã vô hiệu hóa',
      );

    const discountAmount = new Money(0);
    const finalAmount = plan.price;

    const startDate = new Date();
    const endDate = addMonths(startDate, plan.durationMonths);

    const subscription = Subscription.create(
      userId,
      planId,
      startDate,
      endDate,
    );
    await this.subscriptionRepository.save(subscription);

    const now = new Date();
    const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const txnRef = `${yymmdd}_${uuidv4().slice(0, 6).toUpperCase()}`;

    const transaction = Transaction.create(
      userId,
      subscription.subscriptionId,
      planId,
      plan.price,
      discountAmount,
      finalAmount,
      txnRef,
      command.provider, // Sử dụng provider từ command
      { customer_email: command.email },
    );
    await this.transactionRepository.save(transaction);

    // Thêm job timeout vào queue
    const timeoutMs =
      this.configService.getOrThrow<number>('PAYMENT_TIMEOUT_MS') ||
      5 * 60 * 1000; // Mặc định 15 phút
    await this.paymentQueue.add(
      PAYMENT_TIMEOUT_JOB,
      { transactionId: transaction.transactionId.value },
      { delay: timeoutMs },
    );

    try {
      // Ép kiểu để dùng hàm getGateway cụ thể của selector
      const selector = this.paymentGateway as PaymentGatewaySelectorService;
      const gateway =
        typeof selector.getGateway === 'function'
          ? selector.getGateway(command.provider)
          : this.paymentGateway;

      return await gateway.createPaymentUrl({
        txn_ref: txnRef,
        amount: finalAmount.amount,
        description: `Thanh toan dang ky: ${plan.name} #${txnRef}`,
        client_ip: command.clientIp,
        user_id: command.userId,
      });
    } catch (error: unknown) {
      await this.transactionRepository.delete(transaction.transactionId);
      await this.subscriptionRepository.delete(subscription.subscriptionId);
      throw new InternalServerErrorException(String(error));
    }
  }
}
