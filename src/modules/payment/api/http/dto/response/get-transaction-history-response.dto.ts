import { BaseResponseDto } from '@20206205tech/nestjs-common';

export interface TransactionHistoryItemDto {
  id: string;
  plan_id: string;
  base_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_status: string;
  payment_method: string | null;
  paid_at: Date | null;
  created_at: Date;
}

export interface DataGetTransactionHistoryResponseDto {
  items: TransactionHistoryItemDto[];
  total: number;
}

export class GetTransactionHistoryResponseDto extends BaseResponseDto<DataGetTransactionHistoryResponseDto> {}
