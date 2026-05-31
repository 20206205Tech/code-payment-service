import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePlanRequestDto {
  @ApiProperty({ description: 'Tên gói', example: 'VIP 1 tháng' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Số tháng', example: 1 })
  @IsInt()
  @Min(1)
  durationMonths: number;

  @ApiProperty({ description: 'Giá gốc (VND)', example: 10000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['Sử dụng suy luận', 'Sử dụng voice', 'Xử lý tài liệu riêng'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
