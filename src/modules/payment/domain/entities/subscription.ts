import { BaseVersionAggregateRoot, UserId } from '@20206205tech/nestjs-common';
import { PlanId } from '../value-objects/plan-id';
import { SubscriptionId } from '../value-objects/subscription-id';

import { SubscriptionPurchasedEvent } from '../events/subscription-purchased.event';
import { InvalidSubscriptionStatusException } from '../exceptions/invalid-subscription-status.exception';
import { PlanDurationMonths } from '../value-objects/plan-duration-months';
import { SubscriptionStatus } from '../value-objects/subscription-status';

export interface SubscriptionProps {
  id: SubscriptionId;
  userId: UserId;
  planId: PlanId;
  periodStart: Date;
  periodEnd: Date;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

export class Subscription extends BaseVersionAggregateRoot {
  private readonly _userId: UserId;
  private readonly _planId: PlanId;
  private _periodStart: Date;
  private _periodEnd: Date;
  private _status: SubscriptionStatus;
  private _updatedAt: Date;

  private constructor(props: SubscriptionProps) {
    super(props.id.value, props.version ?? 1, true, props.createdAt);
    this._userId = props.userId;
    this._planId = props.planId;
    this._periodStart = props.periodStart;
    this._periodEnd = props.periodEnd;
    this._status = props.status;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    userId: UserId,
    planId: PlanId,
    periodStart: Date,
    periodEnd: Date,
  ): Subscription {
    return new Subscription({
      id: SubscriptionId.create(),
      userId,
      planId,
      periodStart,
      periodEnd,
      status: SubscriptionStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    });
  }

  public static reconstitute(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  public activate(
    durationMonths: PlanDurationMonths,
    baseDate: Date = new Date(),
  ): void {
    const canActivate =
      this._status === SubscriptionStatus.PENDING ||
      this._status === SubscriptionStatus.EXPIRED ||
      this._status === SubscriptionStatus.ACTIVE;

    if (!canActivate) {
      throw new InvalidSubscriptionStatusException(this._status, 'activate');
    }

    this._status = SubscriptionStatus.ACTIVE;
    this._updatedAt = new Date();

    // Nếu có durationMonths, cộng dồn thời gian từ baseDate
    if (durationMonths) {
      this._periodStart = baseDate;
      const newEndDate = new Date(baseDate);
      newEndDate.setMonth(newEndDate.getMonth() + durationMonths.value);
      this._periodEnd = newEndDate;
    }

    // Tăng version mỗi lần activate (lần 1 → version=2, lần 2 → version=3, ...)
    // Lần đầu tiên (version=1) là khi subscription được tạo và lưu vào DB
    this.incrementVersion();

    // Phát sự kiện domain để các handler khác xử lý (ví dụ: gửi mail, outbox)
    this.publish(
      new SubscriptionPurchasedEvent(
        this.subscriptionId.value,
        this._userId.value,
        this._planId.value,
        this._periodStart,
        this._periodEnd,
        this.version.value,
      ),
    );
  }

  public expire(): void {
    this.incrementVersion();
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
  get periodStart(): Date {
    return this._periodStart;
  }
  get periodEnd(): Date {
    return this._periodEnd;
  }
  get status(): SubscriptionStatus {
    return this._status;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
