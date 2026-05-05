import { UserId } from '@20206205tech/nestjs-common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, LessThan, Repository } from 'typeorm';
import { TransactionRepositoryPort } from '../../../application/ports/database/transaction.repository.port';
import { PaymentStatus } from '../../../domain/value-objects/payment-status';
import { Transaction } from '../../../domain/entities/transaction';
import { TransactionId } from '../../../domain/value-objects/transaction-id';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionMapper } from '../mappers/transaction.mapper';

@Injectable()
export class TransactionOrmRepository implements TransactionRepositoryPort {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repo: Repository<TransactionEntity>,
  ) {}

  async findById(id: TransactionId): Promise<Transaction | null> {
    const orm = await this.repo.findOne({ where: { id: id.value } });
    return orm ? TransactionMapper.toDomain(orm) : null;
  }

  async findByTxnRef(txnRef: string): Promise<Transaction | null> {
    const orm = await this.repo.findOne({ where: { transactionRef: txnRef } });
    return orm ? TransactionMapper.toDomain(orm) : null;
  }

  async findBySubscriptionId(
    subscriptionId: string,
  ): Promise<Transaction | null> {
    const orm = await this.repo.findOne({
      where: { subscriptionId: subscriptionId },
      order: { createdAt: 'DESC' },
    });
    return orm ? TransactionMapper.toDomain(orm) : null;
  }

  async findAllByUserId(
    userId: UserId,
    skip: number = 0,
    limit: number = 20,
  ): Promise<Transaction[]> {
    const orms = await this.repo.find({
      where: { userId: userId.value },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return orms.map((orm) => TransactionMapper.toDomain(orm));
  }

  async findPendingExpired(timeoutDate: Date): Promise<Transaction[]> {
    const orms = await this.repo.find({
      where: {
        paymentStatus: PaymentStatus.PENDING,
        createdAt: LessThan(timeoutDate),
      },
      order: { createdAt: 'ASC' },
    });
    return orms.map((orm) => TransactionMapper.toDomain(orm));
  }

  async save(transaction: Transaction, context?: EntityManager): Promise<void> {
    const manager = context || this.repo.manager;
    const orm = TransactionMapper.toOrm(transaction);
    await manager.save(orm);
  }

  async delete(id: TransactionId): Promise<void> {
    await this.repo.delete(id.value);
  }
}
