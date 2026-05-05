import { BaseResponseDto } from '@20206205tech/nestjs-common';

export interface DataArchivePlanResponseDto {
  success: boolean;
}

export class ArchivePlanResponseDto extends BaseResponseDto<DataArchivePlanResponseDto> {}
