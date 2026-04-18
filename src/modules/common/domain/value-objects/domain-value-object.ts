export abstract class DomainValueObject<T> {
  protected readonly _props: T;

  constructor(props: T) {
    this._props = Object.freeze(props);
  }

  public equals(vo?: DomainValueObject<T>): boolean {
    if (vo === null || vo === undefined) return false;
    if (vo._props === undefined) return false;

    if (vo._props === undefined) {
      return false;
    }

    return JSON.stringify(this._props) === JSON.stringify(vo._props);
  }

  get props(): T {
    return this._props;
  }
}
