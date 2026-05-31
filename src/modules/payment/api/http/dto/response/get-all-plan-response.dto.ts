import { BaseResponseDto } from '@20206205tech/nestjs-common';

export interface DataGetAllPlanResponseDto {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
}

export type GetAllPlanResponseData = DataGetAllPlanResponseDto[];

export class GetAllPlanResponseDto extends BaseResponseDto<GetAllPlanResponseData> {}
