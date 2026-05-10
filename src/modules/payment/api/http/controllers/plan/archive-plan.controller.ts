import { Auth } from '@20206205tech/nestjs-auth';
import { BaseController } from '@20206205tech/nestjs-common';
import { Controller, Delete, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArchivePlanCommand } from '../../../../application/commands/archive-plan.command';
import { ArchivePlanResponseDto } from '../../dto/response/archive-plan-response.dto';

@ApiTags('Plans')
@Controller('plans')
export class ArchivePlanController extends BaseController {
  @Delete(':plan_id')
  @Auth.Admin()
  async execute(
    @Param('plan_id', new ParseUUIDPipe({ version: '4' })) planId: string,
  ): Promise<ArchivePlanResponseDto> {
    await this.commandBus.execute(new ArchivePlanCommand(planId));

    return new ArchivePlanResponseDto({
      message: 'Xóa gói dịch vụ thành công',
      data: { success: true },
    });
  }
}
