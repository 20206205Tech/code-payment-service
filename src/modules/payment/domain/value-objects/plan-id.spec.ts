import { PlanId } from './plan-id';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlanId', () => {
  it('should create PlanId with a valid UUID', () => {
    const id = new PlanId(VALID_UUID);
    expect(id.value).toBe(VALID_UUID);
  });

  it('should throw for an invalid UUID', () => {
    expect(() => new PlanId('not-valid')).toThrow('Invalid ID format');
  });

  it('PlanId.create() should generate a valid UUID', () => {
    const id = PlanId.create();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('two created PlanIds should be unique', () => {
    const a = PlanId.create();
    const b = PlanId.create();
    expect(a.value).not.toBe(b.value);
  });

  it('should be equal when values match', () => {
    const a = new PlanId(VALID_UUID);
    const b = new PlanId(VALID_UUID);
    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal when values differ', () => {
    const a = PlanId.create();
    const b = PlanId.create();
    expect(a.equals(b)).toBe(false);
  });
});
