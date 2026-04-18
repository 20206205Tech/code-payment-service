// export class ValidationContext {}

// domain/value-objects/validation-context.ts

export class ValidationContext {
  constructor(
    public readonly planId: string,
    public readonly subTotal: number,
    public readonly isFirstPurchase: boolean,
  ) {}
}

// import { DomainValueObject } from './domain-value-object';
// import { Money } from './money';
// import { PlanId } from './plan-id';

// /**
//  * ValidationContext - Bối cảnh để validate Coupon
//  * Đây là DTO chứa thông tin thực tế khi khách hàng áp dụng mã giảm giá
//  *
//  * Theo 1.ts và 2.ts: Context này được Application Layer tạo ra
//  * và truyền vào Domain để Coupon tự validate
//  */
// export interface ValidationContextProps {
//   planId: PlanId;           // Khách đang mua gói nào?
//   subTotal: Money;          // Tổng tiền trước giảm giá
//   isFirstPurchase: boolean; // Khách mua lần đầu hay gia hạn?
// }

// export class ValidationContext extends DomainValueObject<ValidationContextProps> {
//   private constructor(props: ValidationContextProps) {
//     super(props);
//   }

//   public static create(
//     planId: PlanId,
//     subTotal: Money,
//     isFirstPurchase: boolean,
//   ): ValidationContext {
//     return new ValidationContext({
//       planId,
//       subTotal,
//       isFirstPurchase,
//     });
//   }

//   get planId(): PlanId {
//     return this._props.planId;
//   }

//   get subTotal(): Money {
//     return this._props.subTotal;
//   }

//   get isFirstPurchase(): boolean {
//     return this._props.isFirstPurchase;
//   }
// }
