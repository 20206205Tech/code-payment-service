export class SubscriptionPurchasedEvent {
  constructor(
    public readonly subscriptionId: string,
    public readonly userId: string,
    public readonly planId: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly version: number = 0,
  ) {}
}
