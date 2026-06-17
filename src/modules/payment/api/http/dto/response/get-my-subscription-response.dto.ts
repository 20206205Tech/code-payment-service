import { BaseResponseDto } from '@20206205tech/nestjs-common';

export interface DataGetMySubscriptionResponseDto {
  has_active_subscription: boolean;
  period_start?: Date;
  period_end?: Date;
}

export class GetMySubscriptionResponseDto extends BaseResponseDto<DataGetMySubscriptionResponseDto> {}
