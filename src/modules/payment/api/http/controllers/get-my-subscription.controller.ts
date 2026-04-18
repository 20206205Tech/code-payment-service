import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../../../auth/decorators/auth.decorator';
import type { JwtPayload } from '../../../../auth/decorators/current-user.decorator';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator';
import { GetMySubscriptionQuery } from '../../../application/queries/get-my-subscription.query';
import { type MySubscriptionResponse } from '../../../application/queries/get-my-subscription.query-handler';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class GetMySubscriptionController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  @Auth.User()
  async execute(@CurrentUser() user: JwtPayload) {
    const intermediate: unknown = await this.queryBus.execute(
      new GetMySubscriptionQuery(user.userId),
    );
    const data = intermediate as MySubscriptionResponse;
    return {
      success: true,
      message: 'Lấy thông tin subscription thành công',
      data,
    };
  }
}
