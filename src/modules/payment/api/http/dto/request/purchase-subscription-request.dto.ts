import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PurchaseSubscriptionRequestDto {
  @ApiProperty()
  @IsString()
  plan_id: string;

  @ApiProperty({ example: 'vnpay' })
  @IsString()
  provider: string;
}
