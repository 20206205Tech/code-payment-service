import { UserId, BaseVersionAggregateRoot } from '@20206205tech/nestjs-common';
import { PlanId } from '../value-objects/plan-id';
import { SubscriptionId } from '../value-objects/subscription-id';

import { SubscriptionStatus } from '../value-objects/subscription-status';
import { SubscriptionPurchasedEvent } from '../events/subscription-purchased.event';
import { InvalidSubscriptionStatusException } from '../exceptions/invalid-subscription-status.exception';

export interface SubscriptionProps {
  id: SubscriptionId;
  userId: UserId;
  planId: PlanId;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

export class Subscription extends BaseVersionAggregateRoot {
  private readonly _userId: UserId;
  private readonly _planId: PlanId;
  private _startDate: Date;
  private _endDate: Date;
  private _status: SubscriptionStatus;
  private _updatedAt: Date;

  private constructor(props: SubscriptionProps) {
    super(props.id.value, props.version ?? 1, true, props.createdAt);
    this._userId = props.userId;
    this._planId = props.planId;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._status = props.status;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    userId: UserId,
    planId: PlanId,
    startDate: Date,
    endDate: Date,
  ): Subscription {
    return new Subscription({
      id: SubscriptionId.create(),
      userId,
      planId,
      startDate,
      endDate,
      status: SubscriptionStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });
  }

  public static reconstitute(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  public activate(durationMonths?: number, baseDate: Date = new Date()): void {
    if (
      this._status !== SubscriptionStatus.PENDING &&
      this._status !== SubscriptionStatus.EXPIRED
    ) {
      throw new InvalidSubscriptionStatusException(this._status, 'activate');
    }

    this._status = SubscriptionStatus.ACTIVE;
    this._updatedAt = new Date();

    // Nếu có durationMonths, cập nhật lại thời hạn bắt đầu từ baseDate
    if (durationMonths) {
      this._startDate = baseDate;
      const newEndDate = new Date(baseDate);
      newEndDate.setMonth(newEndDate.getMonth() + durationMonths);
      this._endDate = newEndDate;
    }

    // Phát sự kiện domain để các handler khác xử lý (ví dụ: gửi mail, outbox)
    this.publish(
      new SubscriptionPurchasedEvent(
        this.subscriptionId.value,

        this._userId.value,
        this._planId.value,
        this._startDate,
        this._endDate,
        this.version.value,
      ),
    );
  }

  public expire(): void {
    this._status = SubscriptionStatus.EXPIRED;
    this._updatedAt = new Date();
  }

  get subscriptionId(): SubscriptionId {
    return new SubscriptionId(this.id);
  }

  get userId(): UserId {
    return this._userId;
  }
  get planId(): PlanId {
    return this._planId;
  }
  get startDate(): Date {
    return this._startDate;
  }
  get endDate(): Date {
    return this._endDate;
  }
  get status(): SubscriptionStatus {
    return this._status;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
