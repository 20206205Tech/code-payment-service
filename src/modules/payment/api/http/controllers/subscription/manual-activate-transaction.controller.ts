import { Auth } from '@20206205tech/nestjs-common';
import { Controller, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { ManualActivateTransactionCommand } from '../../../../application/commands/manual-activate-transaction.command';
import { Transaction } from '../../../../domain/entities/transaction';
import { ManualActivateTransactionResponseDto } from '../../dto/response/manual-activate-transaction-response.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class ManualActivateTransactionController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('manual-activate/:transaction_id')
  @Auth.Admin()
  async execute(
    @Param('transaction_id') transactionId: string,
  ): Promise<ManualActivateTransactionResponseDto> {
    const result: unknown = await this.commandBus.execute(
      new ManualActivateTransactionCommand(transactionId),
    );
    const txn = result as Transaction;
    return new ManualActivateTransactionResponseDto({
      message: `Đã kích hoạt thủ công giao dịch cho user ${txn.userId.value}`,
      data: {
        transaction_id: txn.transactionId.value,
        subscription_id: txn.subscriptionId.value,
      },
    });
  }
}
