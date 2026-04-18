import { UserId } from './user-id';

describe('UserId', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('should create an instance with a valid UUID', () => {
    const userId = new UserId(validUuid);
    expect(userId).toBeDefined();
    expect(userId.value).toBe(validUuid);
  });

  it('should generate a new instance using the create() factory method', () => {
    const userId = UserId.create();
    expect(userId).toBeDefined();
    // Đảm bảo value được sinh ra là một string không rỗng
    expect(typeof userId.value).toBe('string');
    expect(userId.value.length).toBeGreaterThan(0);
  });

  describe('equals()', () => {
    it('should correctly evaluate equality between UserIds', () => {
      const id1 = new UserId(validUuid);
      const id2 = new UserId(validUuid);
      const id3 = UserId.create();

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });
  });
});
