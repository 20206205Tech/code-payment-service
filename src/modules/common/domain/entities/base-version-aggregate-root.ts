import { BaseVersion } from '../value-objects/base-version';
import { BaseEntity } from './base-entity';

export abstract class BaseVersionAggregateRoot extends BaseEntity {
  constructor(
    id: string,
    public version: BaseVersion,
    isActive: boolean,
    createdAt: Date,
  ) {
    super(id, isActive, createdAt);
  }

  incrementVersion() {
    this.version = new BaseVersion(this.version.value + 1);
  }
}
