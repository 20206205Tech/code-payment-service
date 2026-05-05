import { BaseResponseDto } from '@20206205tech/nestjs-common';
import { DataGetDetailPlanResponseDto } from './get-detail-plan-response.dto';

// Ở đây trả về một mảng các kế hoạch
export type DataGetAllPlanResponseDto = DataGetDetailPlanResponseDto[];

export class GetAllPlanResponseDto extends BaseResponseDto<DataGetAllPlanResponseDto> {}
