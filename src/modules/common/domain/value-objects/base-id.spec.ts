import { BaseId } from './base-id';

// Tạo một Dummy Class để test Abstract Class
class TestId extends BaseId {
  public static createTest(): TestId {
    return new TestId(this.generateUuid());
  }
}

describe('BaseId', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('should create an instance with a valid UUID', () => {
    const id = new TestId(validUuid);
    expect(id).toBeDefined();
    expect(id.value).toBe(validUuid);
  });

  it('should throw an error if the provided string is not a valid UUID', () => {
    const invalidValues = [
      'invalid-id',
      '123',
      '',
      '123e4567-e89b-12d3-a456-42661417400z', // Chứa ký tự z không hợp lệ
    ];

    invalidValues.forEach((invalidId) => {
      expect(() => new TestId(invalidId)).toThrow(
        `Invalid ID format: "${invalidId}". Must be a valid UUID.`,
      );
    });
  });

  it('should generate a new valid UUID using generateUuid()', () => {
    const id = TestId.createTest();
    expect(id).toBeDefined();
    expect(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id.value,
      ),
    ).toBe(true);
  });
});
