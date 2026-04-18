import { IQuery } from '@nestjs/cqrs';

export class GetDetailPlanQuery implements IQuery {
  constructor(public readonly planId: string) {}
}
