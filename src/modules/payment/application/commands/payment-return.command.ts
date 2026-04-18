import { ICommand } from '@nestjs/cqrs';

export class PaymentReturnCommand implements ICommand {
  constructor(
    public readonly queryParams: Record<string, any>,
    public readonly provider?: string,
  ) {}
}
