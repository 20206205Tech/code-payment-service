import { BaseResponseDto } from '@20206205tech/nestjs-common';

export interface DataGetMySubscriptionResponseDto {
  has_active_subscription: boolean;
}

export class GetMySubscriptionResponseDto extends BaseResponseDto<DataGetMySubscriptionResponseDto> {}
