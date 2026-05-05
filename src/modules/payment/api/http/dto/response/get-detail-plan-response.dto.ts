import { BaseResponseDto } from '@20206205tech/nestjs-common';

export interface DataGetDetailPlanResponseDto {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
}

export class GetDetailPlanResponseDto extends BaseResponseDto<DataGetDetailPlanResponseDto> {}
