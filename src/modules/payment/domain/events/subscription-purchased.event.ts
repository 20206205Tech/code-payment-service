export class SubscriptionPurchasedEvent {
  constructor(
    public readonly subscriptionId: string,
    public readonly userId: string,
    public readonly planId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {}
}
