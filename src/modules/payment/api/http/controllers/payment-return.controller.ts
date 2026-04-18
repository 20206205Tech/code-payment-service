import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../../../auth/decorators/auth.decorator';
import { BaseController } from '../../../../common/api/http/controllers/base.controller';
import { PaymentReturnCommand } from '../../../application/commands/payment-return.command';
import { PaymentReturnResult } from '../../../application/commands/payment-return.command-handler';

@ApiTags('Payment Callbacks')
@Controller('subscriptions')
export class PaymentReturnController extends BaseController {
  @Get('payment-return/:provider')
  @Auth.Public()
  async handleReturnGet(
    @Param('provider') provider: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.processReturn(query, provider);
  }

  @Post('payment-return/:provider')
  @Auth.Public()
  async handleReturnPost(
    @Param('provider') provider: string,
    @Body() body: Record<string, unknown>,
    @Query() query: Record<string, unknown>,
  ) {
    const data = { ...query, ...body };
    return this.processReturn(data, provider);
  }

  private async processReturn(
    data: Record<string, unknown>,
    provider: string,
  ): Promise<Record<string, unknown>> {
    const intermediate: unknown = await this.commandBus.execute(
      new PaymentReturnCommand(data, provider),
    );
    const result = intermediate as PaymentReturnResult;

    const providerName = provider.toUpperCase();

    if (result.success) {
      return {
        success: true,
        message: `${providerName} transaction success`,
        data: result.txnRef,
      };
    }

    return {
      success: false,
      message:
        result.message || `${providerName} transaction failed or canceled`,
      data: result.txnRef,
    };
  }
}
