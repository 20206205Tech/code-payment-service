import { Inject } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { BaseLogger } from '../../../utils/base-logger';

export abstract class BaseController extends BaseLogger {
  @Inject(CommandBus)
  protected readonly commandBus: CommandBus;

  @Inject(QueryBus)
  protected readonly queryBus: QueryBus;

  constructor() {
    super();
  }
}
