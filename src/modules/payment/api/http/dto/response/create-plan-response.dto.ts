import { BaseResponseDto } from '@20206205tech/nestjs-common';

export interface DataCreatePlanResponseDto {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
}

export class CreatePlanResponseDto extends BaseResponseDto<DataCreatePlanResponseDto> {}
