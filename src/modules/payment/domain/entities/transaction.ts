import { UserId, BaseVersionAggregateRoot } from '@20206205tech/nestjs-common';
import { Money } from '../value-objects/money';
import { PlanId } from '../value-objects/plan-id';
import { SubscriptionId } from '../value-objects/subscription-id';
import { TransactionId } from '../value-objects/transaction-id';
import { PaymentStatus } from '../value-objects/payment-status';

export interface TransactionProps {
  id: TransactionId;
  userId: UserId;
  subscriptionId: SubscriptionId;
  planId: PlanId;
  baseAmount: Money;
  discountAmount: Money;
  finalAmount: Money;
  transactionRef: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  providerTransactionId: string | null;
  paymentMetadata: Record<string, unknown>;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

export class Transaction extends BaseVersionAggregateRoot {
  private readonly _transactionId: TransactionId;
  private readonly _userId: UserId;
  private readonly _subscriptionId: SubscriptionId;
  private readonly _planId: PlanId;
  private readonly _baseAmount: Money;
  private readonly _discountAmount: Money;
  private readonly _finalAmount: Money;
  private readonly _transactionRef: string;
  private readonly _paymentMethod: string;
  private _paymentStatus: PaymentStatus;
  private _providerTransactionId: string | null;
  private _paymentMetadata: Record<string, unknown>;
  private _paidAt: Date | null;
  private _updatedAt: Date;

  private constructor(props: TransactionProps) {
    super(props.id.value, props.version ?? 1, true, props.createdAt);
    this._transactionId = props.id;
    this._userId = props.userId;
    this._subscriptionId = props.subscriptionId;
    this._planId = props.planId;
    this._baseAmount = props.baseAmount;
    this._discountAmount = props.discountAmount;
    this._finalAmount = props.finalAmount;
    this._transactionRef = props.transactionRef;
    this._paymentMethod = props.paymentMethod;
    this._paymentStatus = props.paymentStatus;
    this._providerTransactionId = props.providerTransactionId;
    this._paymentMetadata = props.paymentMetadata;
    this._paidAt = props.paidAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    userId: UserId,
    subscriptionId: SubscriptionId,
    planId: PlanId,
    baseAmount: Money,
    discountAmount: Money,
    finalAmount: Money,
    transactionRef: string,
    paymentMethod: string,
    paymentMetadata: Record<string, unknown> = {},
  ): Transaction {
    return new Transaction({
      id: TransactionId.create(),
      userId,
      subscriptionId,
      planId,
      baseAmount,
      discountAmount,
      finalAmount,
      transactionRef,
      paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      providerTransactionId: null,
      paymentMetadata,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });
  }

  public static reconstitute(props: TransactionProps): Transaction {
    return new Transaction(props);
  }

  public markSuccess(): void {
    this._paymentStatus = PaymentStatus.SUCCESS;
    this._updatedAt = new Date();
  }

  public markFailed(): void {
    this._paymentStatus = PaymentStatus.FAILED;
    this._updatedAt = new Date();
  }

  public markExpired(): void {
    this._paymentStatus = PaymentStatus.EXPIRED;
    this._updatedAt = new Date();
  }

  public setProviderTransactionId(id: string): void {
    this._providerTransactionId = id;
    this._updatedAt = new Date();
  }

  public setPaidAt(date: Date): void {
    this._paidAt = date;
    this._updatedAt = new Date();
  }

  public mergePaymentMetadata(data: Record<string, unknown>): void {
    this._paymentMetadata = { ...(this._paymentMetadata ?? {}), ...data };
    this._updatedAt = new Date();
  }

  public isPending(): boolean {
    return this._paymentStatus === PaymentStatus.PENDING;
  }

  public isSuccess(): boolean {
    return this._paymentStatus === PaymentStatus.SUCCESS;
  }

  get transactionId(): TransactionId {
    return this._transactionId;
  }
  get userId(): UserId {
    return this._userId;
  }
  get subscriptionId(): SubscriptionId {
    return this._subscriptionId;
  }
  get planId(): PlanId {
    return this._planId;
  }
  get baseAmount(): Money {
    return this._baseAmount;
  }
  get discountAmount(): Money {
    return this._discountAmount;
  }
  get finalAmount(): Money {
    return this._finalAmount;
  }
  get transactionRef(): string {
    return this._transactionRef;
  }
  get paymentMethod(): string {
    return this._paymentMethod;
  }
  get paymentStatus(): PaymentStatus {
    return this._paymentStatus;
  }
  get providerTransactionId(): string | null {
    return this._providerTransactionId;
  }
  get paymentMetadata(): Record<string, unknown> {
    return this._paymentMetadata;
  }
  get paidAt(): Date | null {
    return this._paidAt;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
