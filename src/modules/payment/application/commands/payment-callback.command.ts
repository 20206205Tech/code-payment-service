import { ICommand } from '@nestjs/cqrs';

export class PaymentCallbackCommand implements ICommand {
  constructor(
    public readonly requestData: Record<string, any>,
    public readonly provider?: string,
  ) {}
}
