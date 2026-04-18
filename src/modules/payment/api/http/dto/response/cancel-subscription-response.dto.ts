import { BaseResponseDto } from '../../../../../common/api/http/dto/response/base.response.dto';

export interface DataCancelSubscriptionResponseDto {
  success: boolean;
}

export class CancelSubscriptionResponseDto extends BaseResponseDto<DataCancelSubscriptionResponseDto> {}
