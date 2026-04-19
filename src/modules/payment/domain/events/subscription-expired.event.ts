export class SubscriptionExpiredEvent {
  constructor(
    public readonly subscriptionId: string,
    public readonly userId: string,
    public readonly planId: string,
    public readonly expiredAt: Date,
  ) {}
}
