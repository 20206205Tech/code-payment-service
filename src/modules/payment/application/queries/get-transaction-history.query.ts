import { IQuery } from '@nestjs/cqrs';

export class GetTransactionHistoryQuery implements IQuery {
  constructor(
    public readonly userId: string,
    public readonly skip: number = 0,
    public readonly limit: number = 20,
  ) {}
}
