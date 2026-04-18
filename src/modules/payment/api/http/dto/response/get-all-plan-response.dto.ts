import { BaseResponseDto } from '../../../../../common/api/http/dto/response/base.response.dto';
import { DataGetDetailPlanResponseDto } from './get-detail-plan-response.dto';

// Ở đây trả về một mảng các kế hoạch
export type DataGetAllPlanResponseDto = DataGetDetailPlanResponseDto[];

export class GetAllPlanResponseDto extends BaseResponseDto<DataGetAllPlanResponseDto> {}
