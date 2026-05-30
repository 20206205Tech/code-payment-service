import { Auth } from '@20206205tech/nestjs-auth';
import { BaseController } from '@20206205tech/nestjs-common';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePlanCommand } from '../../../../application/commands/create-plan.command';
import { CreatePlanRequestDto } from '../../dto/request/create-plan-request.dto';
import { CreatePlanResponseDto } from '../../dto/response/create-plan-response.dto';

@ApiTags('Plans')
@Controller('plans')
export class CreatePlanController extends BaseController {
  @Post()
  @Auth.Admin()
  async execute(
    @Body() dto: CreatePlanRequestDto,
  ): Promise<CreatePlanResponseDto> {
    const intermediate: unknown = await this.commandBus.execute(
      new CreatePlanCommand(
        dto.name,
        dto.durationMonths,
        dto.price,
        dto.isActive ?? true,
      ),
    );
    // Sử dụng interface thay vì class trực tiếp để tránh lỗi resolution với strict linting
    const result = intermediate as {
      planId: { value: string };
      name: { value: string };
      durationMonths: { value: number };
      price: { amount: number };
    };

    return new CreatePlanResponseDto({
      message: 'Tạo gói dịch vụ thành công',
      data: {
        id: result.planId.value,
        name: result.name.value,
        durationMonths: result.durationMonths.value,
        price: result.price.amount,
      },
    });
  }
}
