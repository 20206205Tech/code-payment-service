import { ICommand } from '@nestjs/cqrs';

export class ManualActivateTransactionCommand implements ICommand {
  constructor(public readonly transactionId: string) {}
}
