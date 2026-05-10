import { Auth } from '@20206205tech/nestjs-auth';
import { BaseController } from '@20206205tech/nestjs-common';
import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PaymentReturnCommand } from '../../../../application/commands/payment-return.command';
import { PaymentReturnResult } from '../../../../application/commands/payment-return.command-handler';

@ApiTags('Payment Controllers')
@Controller('subscriptions')
export class PaymentReturnController extends BaseController {
  @Get('payment-return/:provider')
  @Auth.Public()
  async handleReturnGet(
    @Param('provider') provider: string,
    @Query() query: Record<string, unknown>,
    @Res() res: Response,
  ) {
    return this.processReturn(query, provider, res);
  }

  @Post('payment-return/:provider')
  @Auth.Public()
  async handleReturnPost(
    @Param('provider') provider: string,
    @Body() body: Record<string, unknown>,
    @Query() query: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const data = { ...query, ...body };
    return this.processReturn(data, provider, res);
  }

  private async processReturn(
    data: Record<string, unknown>,
    provider: string,
    res: Response,
  ): Promise<void | Record<string, unknown>> {
    const intermediate: unknown = await this.commandBus.execute(
      new PaymentReturnCommand(data, provider),
    );
    const result = intermediate as PaymentReturnResult;

    // Nếu có redirectUrl từ metadata (do frontend gửi lúc mua)
    if (result.redirectUrl) {
      const targetUrl = new URL(result.redirectUrl);
      targetUrl.searchParams.set('success', result.success.toString());
      if (result.txnRef) targetUrl.searchParams.set('txnRef', result.txnRef);
      if (!result.success && result.message) {
        targetUrl.searchParams.set('message', result.message);
      }

      this.logger.log(`Redirecting to: ${targetUrl.toString()}`);
      return res.redirect(targetUrl.toString());
    }

    // Fallback: Trả về JSON như cũ nếu không có redirectUrl
    const providerName = provider.toUpperCase();

    if (result.success) {
      res.json({
        success: true,
        message: `${providerName} transaction success`,
        data: result.txnRef,
        web:
          process.env.ENVIRONMENT === 'development'
            ? 'http://localhost:3000/'
            : 'https://20206205.tech/',
      });
      return;
    }

    res.json({
      success: false,
      message:
        result.message || `${providerName} transaction failed or canceled`,
      data: result.txnRef,
    });
  }
}
