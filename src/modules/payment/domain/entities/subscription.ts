// domain/entities/subscription.ts

import { AggregateRoot } from '@nestjs/cqrs';
import { PlanId } from '../value-objects/plan-id';
import { SubscriptionId } from '../value-objects/subscription-id';
import { UserId } from '../value-objects/user-id';
import { SubscriptionPurchasedEvent } from '../events/subscription-purchased.event';
import { SubscriptionExpiredEvent } from '../events/subscription-expired.event';

export type SubscriptionStatus = 'pending' | 'active' | 'expired';

export interface SubscriptionProps {
  id: SubscriptionId;
  userId: UserId;
  planId: PlanId;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Subscription extends AggregateRoot {
  private readonly _subscriptionId: SubscriptionId;
  private readonly _userId: UserId;
  private readonly _planId: PlanId;
  private readonly _startDate: Date;
  private readonly _endDate: Date;
  private _status: SubscriptionStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: SubscriptionProps) {
    super();
    this._subscriptionId = props.id;
    this._userId = props.userId;
    this._planId = props.planId;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._status = props.status;
    this._createdAt = props.createdAt;
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
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  public activate(): void {
    this._status = 'active';
    this._updatedAt = new Date();

    this.apply(
      new SubscriptionPurchasedEvent(
        this._subscriptionId.value,
        this._userId.value,
        this._planId.value,
        this._startDate,
        this._endDate,
      ),
    );
  }

  public expire(): void {
    this._status = 'expired';
    this._updatedAt = new Date();

    this.apply(
      new SubscriptionExpiredEvent(
        this._subscriptionId.value,
        this._userId.value,
        this._planId.value,
        this._updatedAt,
      ),
    );
  }

  get subscriptionId(): SubscriptionId {
    return this._subscriptionId;
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
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}

// import { BaseVersionAggregateRoot } from './base-version-aggregate-root';
// import { SubscriptionId } from '../value-objects/subscription-id';
// import { UserId } from '../value-objects/user-id';
// import { PlanId } from '../value-objects/plan-id';
// import { BaseVersion } from '../value-objects/base-version';
// import { SubscriptionPurchasedEvent } from '../events/subscription-purchased.event';
// import { SubscriptionCancelledEvent } from '../events/subscription-cancelled.event';

// export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

// export interface SubscriptionProps {
//   id: SubscriptionId;
//   userId: UserId;
//   planId: PlanId;
//   startDate: Date;
//   endDate: Date;
//   status: SubscriptionStatus;
//   autoRenew: boolean;
//   isActive: boolean;
//   createdAt: Date;
//   version: BaseVersion;
// }

// export class Subscription extends BaseVersionAggregateRoot {
//   private readonly _subscriptionId: SubscriptionId;
//   private readonly _userId: UserId;
//   private readonly _planId: PlanId;
//   private _startDate: Date;
//   private _endDate: Date;
//   private _status: SubscriptionStatus;
//   private _autoRenew: boolean;

//   private constructor(props: SubscriptionProps) {
//     super(props.id.value, props.version, props.isActive, props.createdAt);
//     this._subscriptionId = props.id;
//     this._userId = props.userId;
//     this._planId = props.planId;
//     this._startDate = props.startDate;
//     this._endDate = props.endDate;
//     this._status = props.status;
//     this._autoRenew = props.autoRenew;
//   }

//   /**
//    * Factory method: Tạo subscription mới khi user mua gói
//    */
//   public static create(
//     userId: UserId,
//     planId: PlanId,
//     startDate: Date,
//     endDate: Date,
//   ): Subscription {
//     const props: SubscriptionProps = {
//       id: SubscriptionId.create(),
//       userId,
//       planId,
//       startDate,
//       endDate,
//       status: 'PENDING', // Ban đầu là PENDING, chờ thanh toán
//       autoRenew: false,
//       isActive: true,
//       createdAt: new Date(),
//       version: new BaseVersion(1),
//     };

//     const subscription = new Subscription(props);

//     // Emit event: Subscription được tạo (nhưng chưa active)
//     subscription.apply(
//       new SubscriptionPurchasedEvent(
//         subscription._subscriptionId,
//         subscription._userId,
//         subscription._planId,
//         subscription._startDate,
//         subscription._endDate,
//       ),
//     );

//     return subscription;
//   }

//   public static reconstitute(props: SubscriptionProps): Subscription {
//     return new Subscription(props);
//   }

//   /**
//    * Activate subscription sau khi payment thành công
//    */
//   public activate(): void {
//     if (this._status !== 'PENDING') {
//       throw new Error('Only PENDING subscriptions can be activated');
//     }

//     this._status = 'ACTIVE';
//     this.incrementVersion();
//   }

//   /**
//    * Cancel subscription
//    */
//   public cancel(): void {
//     if (this._status === 'CANCELLED') {
//       throw new Error('Subscription is already cancelled');
//     }

//     this._status = 'CANCELLED';
//     this._isActive = false;
//     this.incrementVersion();

//     this.apply(
//       new SubscriptionCancelledEvent(
//         this._subscriptionId,
//         this._userId,
//         new Date(),
//       ),
//     );
//   }

//   /**
//    * Check if subscription is expired
//    */
//   public checkExpiry(): void {
//     const now = new Date();
//     if (this._status === 'ACTIVE' && now > this._endDate) {
//       this._status = 'EXPIRED';
//       this._isActive = false;
//       this.incrementVersion();
//     }
//   }

//   /**
//    * Renew subscription (extend endDate)
//    */
//   public renew(newEndDate: Date): void {
//     if (this._status !== 'ACTIVE' && this._status !== 'EXPIRED') {
//       throw new Error('Cannot renew a cancelled or pending subscription');
//     }

//     this._endDate = newEndDate;
//     this._status = 'ACTIVE';
//     this._isActive = true;
//     this.incrementVersion();
//   }

//   /**
//    * Enable auto-renew
//    */
//   public enableAutoRenew(): void {
//     this._autoRenew = true;
//     this.incrementVersion();
//   }

//   /**
//    * Disable auto-renew
//    */
//   public disableAutoRenew(): void {
//     this._autoRenew = false;
//     this.incrementVersion();
//   }

//   // Getters
//   get subscriptionId(): SubscriptionId {
//     return this._subscriptionId;
//   }

//   get userId(): UserId {
//     return this._userId;
//   }

//   get planId(): PlanId {
//     return this._planId;
//   }

//   get startDate(): Date {
//     return this._startDate;
//   }

//   get endDate(): Date {
//     return this._endDate;
//   }

//   get status(): SubscriptionStatus {
//     return this._status;
//   }

//   get autoRenew(): boolean {
//     return this._autoRenew;
//   }

//   /**
//    * Domain logic: Check if currently active
//    */
//   public isCurrentlyActive(): boolean {
//     const now = new Date();
//     return (
//       this._status === 'ACTIVE' &&
//       this._isActive &&
//       now >= this._startDate &&
//       now <= this._endDate
//     );
//   }

//   /**
//    * Domain logic: Get remaining days
//    */
//   public getRemainingDays(): number {
//     if (!this.isCurrentlyActive()) {
//       return 0;
//     }

//     const now = new Date();
//     const diffTime = this._endDate.getTime() - now.getTime();
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//     return Math.max(0, diffDays);
//   }
// }
