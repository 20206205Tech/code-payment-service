import type { JwtPayload } from '@20206205tech/nestjs-common';
import { Auth, CurrentUser } from '@20206205tech/nestjs-common';
import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { GetMySubscriptionQuery } from '../../../../application/queries/get-my-subscription.query';
import { type MySubscriptionResponse } from '../../../../application/queries/get-my-subscription.query-handler';
import { GetMySubscriptionResponseDto } from '../../dto/response/get-my-subscription-response.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class GetMySubscriptionController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('')
  @Auth.User()
  async execute(
    @CurrentUser() user: JwtPayload,
  ): Promise<GetMySubscriptionResponseDto> {
    const intermediate: unknown = await this.queryBus.execute(
      new GetMySubscriptionQuery(user.userId),
    );
    const data = intermediate as MySubscriptionResponse;
    return new GetMySubscriptionResponseDto({
      message: 'Lấy thông tin subscription thành công',
      data,
    });
  }
}
