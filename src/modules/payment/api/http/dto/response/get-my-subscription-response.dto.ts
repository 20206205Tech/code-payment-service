import { BaseResponseDto } from '@20206205tech/nestjs-common';

export interface DataGetMySubscriptionResponseDto {
  subscription: {
    id: string;
    user_id: string;
    plan_id: string;
    start_date: Date;
    end_date: Date;
    status: string;
    created_at: Date;
  } | null;
  has_active_subscription: boolean;
  days_remaining: number | null;
}

export class GetMySubscriptionResponseDto extends BaseResponseDto<DataGetMySubscriptionResponseDto> {}
