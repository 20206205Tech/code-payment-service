import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../../../auth/decorators/auth.decorator';
import { CurrentUserId } from '../../../../auth/decorators/current-user.decorator';
import { GetTransactionHistoryQuery } from '../../../application/queries/get-transaction-history.query';
import { TransactionHistoryItem } from '../../../application/queries/get-transaction-history.query-handler';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class GetTransactionHistoryController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('history')
  @Auth.User()
  async execute(
    @CurrentUserId() userId: string,
    @Query('skip') skip: number = 0,
    @Query('limit') limit: number = 20,
  ) {
    const intermediate: unknown = await this.queryBus.execute(
      new GetTransactionHistoryQuery(userId, skip, limit),
    );
    const data = intermediate as TransactionHistoryItem[];
    return { success: true, message: 'Lấy lịch sử giao dịch thành công', data };
  }
}
