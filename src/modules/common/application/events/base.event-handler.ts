import { IEvent } from '@nestjs/cqrs';
import { BaseLogger } from '../../utils/base-logger';

export abstract class BaseEventHandler<
  TEvent extends IEvent,
> extends BaseLogger {
  // implements IEventHandler<TEvent>
  constructor() {
    super();
  }

  abstract handle(event: TEvent): any;
}
