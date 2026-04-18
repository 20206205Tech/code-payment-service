import { SubscriptionId } from './subscription-id';

describe('SubscriptionId', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('should create an instance with a valid UUID', () => {
    const subscriptionId = new SubscriptionId(validUuid);
    expect(subscriptionId).toBeDefined();
    expect(subscriptionId.value).toBe(validUuid);
  });

  it('should generate a new instance using the create() factory method', () => {
    const subscriptionId = SubscriptionId.create();
    expect(subscriptionId).toBeDefined();
    // Đảm bảo value được sinh ra là một string không rỗng
    expect(typeof subscriptionId.value).toBe('string');
    expect(subscriptionId.value.length).toBeGreaterThan(0);
  });

  describe('equals()', () => {
    it('should correctly evaluate equality between SubscriptionIds', () => {
      const id1 = new SubscriptionId(validUuid);
      const id2 = new SubscriptionId(validUuid);
      const id3 = SubscriptionId.create();

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });
  });
});
