import { PlanId } from './plan-id';

describe('PlanId', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('should create an instance with a valid UUID', () => {
    const planId = new PlanId(validUuid);
    expect(planId).toBeDefined();
    expect(planId.value).toBe(validUuid);
  });

  it('should generate a new instance using the create() factory method', () => {
    const planId = PlanId.create();
    expect(planId).toBeDefined();
    // Đảm bảo value được sinh ra là một string không rỗng
    expect(typeof planId.value).toBe('string');
    expect(planId.value.length).toBeGreaterThan(0);
  });

  describe('equals()', () => {
    it('should correctly evaluate equality between PlanIds', () => {
      const id1 = new PlanId(validUuid);
      const id2 = new PlanId(validUuid);
      const id3 = PlanId.create();

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });
  });
});
