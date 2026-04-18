import { BaseResponseDto } from '../../../../../common/api/http/dto/response/base.response.dto';

export interface DataArchivePlanResponseDto {
  success: boolean;
}

export class ArchivePlanResponseDto extends BaseResponseDto<DataArchivePlanResponseDto> {}
