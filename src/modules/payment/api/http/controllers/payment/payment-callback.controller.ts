import { Auth } from '@20206205tech/nestjs-auth';
import { BaseController } from '@20206205tech/nestjs-common';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentCallbackCommand } from '../../../../application/commands/payment-callback.command';
import { PaymentProvider } from '../../../../infrastructure/payment/payment-provider.enum';

interface CommandResult {
  success: boolean;
  message: string;
}

@ApiTags('Payment Controllers')
@Controller('subscriptions')
export class PaymentCallbackController extends BaseController {
  @Get('payment-callback/:provider')
  @Auth.Public()
  @HttpCode(200)
  async handleCallbackGet(
    @Param('provider') provider: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.processCallback(query, provider);
  }

  @Post('payment-callback/:provider')
  @Auth.Public()
  @HttpCode(200)
  async handleCallbackPost(
    @Param('provider') provider: string,
    @Body() body: Record<string, unknown>,
    @Query() query: Record<string, unknown>,
  ) {
    const data = { ...query, ...body };
    return this.processCallback(data, provider);
  }

  private async processCallback(
    data: Record<string, unknown>,
    provider: string,
  ): Promise<Record<string, unknown> | CommandResult> {
    this.logger.log(`[IPN] Incoming callback for provider: ${provider}`);
    const intermediate: unknown = await this.commandBus.execute(
      new PaymentCallbackCommand(data, provider),
    );
    const result = intermediate as CommandResult;

    if (provider === (PaymentProvider.VNPAY as string)) {
      if (result.success) return { RspCode: '00', Message: 'Confirm Success' };
      if (result.message?.includes('Sai chữ ký'))
        return { RspCode: '97', Message: 'Invalid Checksum' };
      return { RspCode: '99', Message: result.message || 'Error' };
    }

    if (provider === (PaymentProvider.MOMO as string)) {
      return { resultCode: result.success ? 0 : 99, message: result.message };
    }

    if (provider === (PaymentProvider.ZALOPAY as string)) {
      return {
        return_code: result.success ? 1 : 2,
        return_message: result.message,
      };
    }

    if (provider === (PaymentProvider.SEPAY as string)) {
      return { success: result.success, message: result.message };
    }

    return result;
  }
}
