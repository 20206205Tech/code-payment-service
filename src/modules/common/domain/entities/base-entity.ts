import { AggregateRoot } from '@nestjs/cqrs';

export abstract class BaseEntity extends AggregateRoot {
  protected _isActive: boolean;
  protected readonly _createdAt: Date;

  constructor(
    public readonly id: string,
    isActive: boolean,
    createdAt: Date,
  ) {
    super();
    this._isActive = isActive;
    this._createdAt = createdAt;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
