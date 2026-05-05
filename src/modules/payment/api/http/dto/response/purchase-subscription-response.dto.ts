import { BaseResponseDto } from '@20206205tech/nestjs-common';

export interface DataPurchaseSubscriptionResponseDto {
  payment_url: string;
}

export class PurchaseSubscriptionResponseDto extends BaseResponseDto<DataPurchaseSubscriptionResponseDto> {}
