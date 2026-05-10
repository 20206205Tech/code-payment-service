import { Auth } from '@20206205tech/nestjs-auth';
import { BaseController } from '@20206205tech/nestjs-common';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAllPlanQuery } from '../../../../application/queries/get-all-plan.query';
import { type PlanResponseItem } from '../../../../application/queries/get-all-plan.query-handler';
import { GetAllPlanResponseDto } from '../../dto/response/get-all-plan-response.dto';

@ApiTags('Plans')
@Controller('plans')
export class GetAllPlanController extends BaseController {
  @Get()
  @Auth.Public()
  async execute(
    @Query('skip') skip: number = 0,
    @Query('limit') limit: number = 100,
  ): Promise<GetAllPlanResponseDto> {
    const intermediate: unknown = await this.queryBus.execute(
      new GetAllPlanQuery(skip, limit),
    );
    const result = intermediate as PlanResponseItem[];

    return new GetAllPlanResponseDto({
      message: 'Lấy danh sách gói dịch vụ thành công',
      data: result,
    });
  }
}
