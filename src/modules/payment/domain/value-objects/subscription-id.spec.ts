import { SubscriptionId } from './subscription-id';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('SubscriptionId', () => {
  it('should create SubscriptionId with a valid UUID', () => {
    const id = new SubscriptionId(VALID_UUID);
    expect(id.value).toBe(VALID_UUID);
  });

  it('should throw for an invalid UUID', () => {
    expect(() => new SubscriptionId('bad-uuid')).toThrow('Invalid ID format');
  });

  it('SubscriptionId.create() should generate a valid UUID', () => {
    const id = SubscriptionId.create();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('two created SubscriptionIds should be unique', () => {
    const a = SubscriptionId.create();
    const b = SubscriptionId.create();
    expect(a.value).not.toBe(b.value);
  });
});
