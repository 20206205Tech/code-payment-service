import { Auth, CurrentUserId } from '@20206205tech/nestjs-auth';
import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { GetTransactionHistoryQuery } from '../../../../application/queries/get-transaction-history.query';
import { TransactionHistoryItem } from '../../../../application/queries/get-transaction-history.query-handler';
import { GetTransactionHistoryResponseDto } from '../../dto/response/get-transaction-history-response.dto';

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
  ): Promise<GetTransactionHistoryResponseDto> {
    const intermediate: unknown = await this.queryBus.execute(
      new GetTransactionHistoryQuery(userId, skip, limit),
    );
    const data = intermediate as TransactionHistoryItem[];
    return new GetTransactionHistoryResponseDto({
      message: 'Lấy lịch sử giao dịch thành công',
      data,
    });
  }
}
