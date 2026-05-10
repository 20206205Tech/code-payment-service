import type { JwtPayload } from '@20206205tech/nestjs-auth';
import { Auth, CurrentUser } from '@20206205tech/nestjs-auth';
import { Body, Controller, Post, Req } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PurchaseSubscriptionCommand } from '../../../../application/commands/purchase-subscription.command';
import { PurchaseSubscriptionRequestDto } from '../../dto/request/purchase-subscription-request.dto';
import { PurchaseSubscriptionResponseDto } from '../../dto/response/purchase-subscription-response.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class PurchaseSubscriptionController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('purchase')
  @Auth.User()
  async execute(
    @Body() dto: PurchaseSubscriptionRequestDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<PurchaseSubscriptionResponseDto> {
    const clientIp = req.ip || req.socket.remoteAddress || '';
    const intermediate: unknown = await this.commandBus.execute(
      new PurchaseSubscriptionCommand(
        user.userId,
        user.email,
        dto.plan_id,
        clientIp,
        dto.redirect_url,
      ),
    );
    const paymentUrl = intermediate as string;

    return new PurchaseSubscriptionResponseDto({
      message: 'Khởi tạo thanh toán thành công',
      data: { payment_url: paymentUrl },
    });
  }
}
