import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PurchaseSubscriptionRequestDto {
  @ApiProperty()
  @IsString()
  plan_id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  redirect_url?: string;
}
