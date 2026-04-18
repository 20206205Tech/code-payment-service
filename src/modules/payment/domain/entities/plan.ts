import { Money } from '../value-objects/money';
import { PlanId } from '../value-objects/plan-id';

export interface PlanProps {
  id: PlanId;
  name: string;
  durationMonths: number;
  price: Money;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Plan {
  private readonly _planId: PlanId;
  private _name: string;
  private _durationMonths: number;
  private _price: Money;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: PlanProps) {
    this._planId = props.id;
    this._name = props.name;
    this._durationMonths = props.durationMonths;
    this._price = props.price;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(
    name: string,
    durationMonths: number,
    price: Money,
    isActive: boolean = true,
  ): Plan {
    return new Plan({
      id: PlanId.create(),
      name,
      durationMonths,
      price,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(props: PlanProps): Plan {
    return new Plan(props);
  }

  // public update(
  //   name?: string,
  //   durationMonths?: number,
  //   price?: Money,
  //   isActive?: boolean,
  // ): void {
  //   if (name !== undefined) this._name = name;
  //   if (durationMonths !== undefined) this._durationMonths = durationMonths;
  //   if (price !== undefined) this._price = price;
  //   if (isActive !== undefined) this._isActive = isActive;
  //   this._updatedAt = new Date();
  // }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  get planId(): PlanId {
    return this._planId;
  }
  get name(): string {
    return this._name;
  }
  get durationMonths(): number {
    return this._durationMonths;
  }
  get price(): Money {
    return this._price;
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
