import { IQuery } from '@nestjs/cqrs';
import { BaseLogger } from '../../utils/base-logger';

export abstract class BaseQueryHandler<
  TQuery extends IQuery,
  TResult = any,
> extends BaseLogger {
  // implements IQueryHandler<TQuery, TResult>
  constructor() {
    super();
  }

  abstract execute(query: TQuery): Promise<TResult>;
}
