import { BaseVersionAggregateRoot } from '@20206205tech/nestjs-common';
import { DEFAULT_PLAN_FEATURES } from '../value-objects/constants';
import { Money } from '../value-objects/money';
import { PlanDurationMonths } from '../value-objects/plan-duration-months';
import { PlanId } from '../value-objects/plan-id';
import { PlanName } from '../value-objects/plan-name';

export interface PlanProps {
  id: PlanId;
  name: PlanName;
  durationMonths: PlanDurationMonths;
  price: Money;
  isActive: boolean;
  features?: string[];
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

export class Plan extends BaseVersionAggregateRoot {
  private readonly _planId: PlanId;
  private readonly _name: PlanName;
  private readonly _durationMonths: PlanDurationMonths;
  private _price: Money;
  private readonly _features: string[];
  private _updatedAt: Date;

  private constructor(props: PlanProps) {
    super(props.id.value, props.version ?? 1, props.isActive, props.createdAt);
    this._planId = props.id;
    this._name = props.name;
    this._durationMonths = props.durationMonths;
    this._price = props.price;
    this._features = props.features ?? DEFAULT_PLAN_FEATURES;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    name: PlanName,
    durationMonths: PlanDurationMonths,
    price: Money,
    isActive: boolean = true,
    features: string[] = DEFAULT_PLAN_FEATURES,
  ): Plan {
    return new Plan({
      id: PlanId.create(),
      name,
      durationMonths,
      price,
      isActive,
      features,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    });
  }

  public static reconstitute(props: PlanProps): Plan {
    return new Plan(props);
  }

  public archive(): void {
    this.incrementVersion();
    this._isActive = false;
    this._updatedAt = new Date();
  }

  get planId(): PlanId {
    return this._planId;
  }
  get name(): PlanName {
    return this._name;
  }
  get durationMonths(): PlanDurationMonths {
    return this._durationMonths;
  }
  get price(): Money {
    return this._price;
  }

  get features(): string[] {
    return this._features;
  }

  get isActive(): boolean {
    return this._isActive;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
