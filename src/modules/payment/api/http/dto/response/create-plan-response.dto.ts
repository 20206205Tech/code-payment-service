import { BaseResponseDto } from '../../../../../common/api/http/dto/response/base.response.dto';

export interface DataCreatePlanResponseDto {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
}

export class CreatePlanResponseDto extends BaseResponseDto<DataCreatePlanResponseDto> {}
