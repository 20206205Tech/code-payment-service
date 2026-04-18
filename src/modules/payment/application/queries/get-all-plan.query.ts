import { IQuery } from '@nestjs/cqrs';

export class GetAllPlanQuery implements IQuery {
  constructor(
    public readonly skip: number = 0,
    public readonly limit: number = 100,
  ) {}
}
