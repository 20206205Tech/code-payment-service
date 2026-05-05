import { BaseResponseDto } from '@20206205tech/nestjs-common';

export interface DataManualActivateTransactionResponseDto {
  transaction_id: string;
  subscription_id: string;
}

export class ManualActivateTransactionResponseDto extends BaseResponseDto<DataManualActivateTransactionResponseDto> {}
