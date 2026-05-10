import { Auth } from '@20206205tech/nestjs-auth';
import { BaseController } from '@20206205tech/nestjs-common';
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type PlanResponseItem } from '../../../../application/queries/get-all-plan.query-handler';
import { GetDetailPlanQuery } from '../../../../application/queries/get-detail-plan.query';
import { GetDetailPlanResponseDto } from '../../dto/response/get-detail-plan-response.dto';

@ApiTags('Plans')
@Controller('plans')
export class GetDetailPlanController extends BaseController {
  @Get(':plan_id')
  @Auth.Public()
  async execute(
    @Param('plan_id', new ParseUUIDPipe({ version: '4' })) planId: string,
  ): Promise<GetDetailPlanResponseDto> {
    const intermediate: unknown = await this.queryBus.execute(
      new GetDetailPlanQuery(planId),
    );
    const result = intermediate as PlanResponseItem;

    return new GetDetailPlanResponseDto({
      message: 'Lấy thông tin gói dịch vụ thành công',
      data: result,
    });
  }
}
