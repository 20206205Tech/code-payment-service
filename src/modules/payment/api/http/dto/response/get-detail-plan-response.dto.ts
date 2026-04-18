import { BaseResponseDto } from '../../../../../common/api/http/dto/response/base.response.dto';

export interface DataGetDetailPlanResponseDto {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
}

export class GetDetailPlanResponseDto extends BaseResponseDto<DataGetDetailPlanResponseDto> {}
