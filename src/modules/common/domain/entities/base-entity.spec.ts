import { BaseEntity } from './base-entity';

// Tạo Dummy Class để test Abstract Class
class TestEntity extends BaseEntity {
  constructor(id: string, isActive: boolean, createdAt: Date) {
    super(id, isActive, createdAt);
  }
}

describe('BaseEntity', () => {
  it('should initialize correctly with provided values', () => {
    const mockDate = new Date();
    const entity = new TestEntity('test-id', true, mockDate);

    expect(entity).toBeDefined();
    expect(entity.id).toBe('test-id');
    expect(entity.isActive).toBe(true);
    expect(entity.createdAt).toBe(mockDate);
  });

  it('should have access to NestJS CQRS AggregateRoot methods', () => {
    const entity = new TestEntity('test-id', true, new Date());
    expect(entity.getUncommittedEvents()).toHaveLength(0);
  });
});
