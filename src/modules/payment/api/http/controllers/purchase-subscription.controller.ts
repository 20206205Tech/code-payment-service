import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Auth } from '../../../../auth/decorators/auth.decorator';
import type { JwtPayload } from '../../../../auth/decorators/current-user.decorator';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator';
import { PurchaseSubscriptionCommand } from '../../../application/commands/purchase-subscription.command';
import { PurchaseSubscriptionRequestDto } from '../dto/request/purchase-subscription-request.dto';

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
    @Res() res: Response,
  ) {
    const clientIp = req.ip || req.socket.remoteAddress || '';
    const intermediate: unknown = await this.commandBus.execute(
      new PurchaseSubscriptionCommand(
        user.userId,
        user.email,
        dto.plan_id,
        clientIp,
        dto.provider,
      ),
    );
    const paymentUrl = intermediate as string;
    return res.send({ payment_url: paymentUrl });
  }
}
