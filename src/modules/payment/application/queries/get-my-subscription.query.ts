import { IQuery } from '@nestjs/cqrs';

export class GetMySubscriptionQuery implements IQuery {
  constructor(public readonly userId: string) {}
}
