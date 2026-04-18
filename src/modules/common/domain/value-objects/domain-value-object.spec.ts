import { DomainValueObject } from './domain-value-object';

interface MockProps {
  value: string;
  count?: number;
}

class MockValueObject extends DomainValueObject<MockProps> {
  constructor(props: MockProps) {
    super(props);
  }
}

describe('DomainValueObject', () => {
  it('should be defined', () => {
    const vo = new MockValueObject({ value: 'test' });
    expect(vo).toBeDefined();
  });

  it('should return true when comparing two identical Value Objects', () => {
    const vo1 = new MockValueObject({ value: 'hello', count: 1 });
    const vo2 = new MockValueObject({ value: 'hello', count: 1 });

    expect(vo1.equals(vo2)).toBe(true);
  });

  it('should return false when comparing two different Value Objects', () => {
    const vo1 = new MockValueObject({ value: 'hello', count: 1 });
    const vo2 = new MockValueObject({ value: 'world', count: 2 });

    expect(vo1.equals(vo2)).toBe(false);
  });

  it('should return false when comparing with null or undefined', () => {
    const vo = new MockValueObject({ value: 'hello' });

    expect(vo.equals(null as unknown as MockValueObject)).toBe(false);
    expect(vo.equals(undefined as unknown as MockValueObject)).toBe(false);
  });
});
