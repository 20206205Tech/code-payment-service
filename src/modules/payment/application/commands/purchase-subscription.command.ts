import { ICommand } from '@nestjs/cqrs';

export class PurchaseSubscriptionCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly planId: string,
    public readonly clientIp: string,
    public readonly provider: string,
  ) {}
}
