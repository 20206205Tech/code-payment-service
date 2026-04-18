import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Transaction } from '../../domain/entities/transaction';
import { TransactionId } from '../../domain/value-objects/transaction-id';
import {
  SUBSCRIPTION_REPOSITORY_PORT,
  type SubscriptionRepositoryPort,
} from '../ports/database/subscription.repository.port';
import {
  TRANSACTION_REPOSITORY_PORT,
  type TransactionRepositoryPort,
} from '../ports/database/transaction.repository.port';
import { ManualActivateTransactionCommand } from './manual-activate-transaction.command';

@CommandHandler(ManualActivateTransactionCommand)
export class ManualActivateTransactionCommandHandler implements ICommandHandler<ManualActivateTransactionCommand> {
  constructor(
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(SUBSCRIPTION_REPOSITORY_PORT)
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(
    command: ManualActivateTransactionCommand,
  ): Promise<Transaction> {
    const transactionId = new TransactionId(command.transactionId);
    const txn = await this.transactionRepository.findById(transactionId);
    if (!txn) throw new NotFoundException('Không tìm thấy giao dịch này');
    if (txn.isSuccess())
      throw new BadRequestException(
        'Giao dịch này đã được kích hoạt thành công từ trước',
      );

    txn.markSuccess();
    txn.setPaidAt(new Date());
    txn.mergePaymentMetadata({ action: 'MANUAL_BY_ADMIN' });

    const subscriptionData = await this.subscriptionRepository.findById(
      txn.subscriptionId,
    );
    if (subscriptionData) {
      const subscription = this.publisher.mergeObjectContext(subscriptionData);
      subscription.activate();
      await this.subscriptionRepository.deactivateOtherSubscriptions(
        txn.userId,
        subscription.subscriptionId,
      );
      await this.subscriptionRepository.save(subscription);

      // Commit events (SubscriptionPurchasedEvent)
      subscription.commit();
    }

    await this.transactionRepository.save(txn);
    return txn;
  }
}
