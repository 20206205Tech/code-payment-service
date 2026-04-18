import { BaseVersion } from '../value-objects/base-version';
import { BaseVersionAggregateRoot } from './base-version-aggregate-root';

// Tạo Dummy Class để test Abstract Class
class TestAggregateRoot extends BaseVersionAggregateRoot {}

describe('BaseVersionAggregateRoot', () => {
  const mockId = 'uuid-123';
  const initialVersion = new BaseVersion(1);
  const mockDate = new Date();

  it('should initialize successfully with the provided values', () => {
    const aggregate = new TestAggregateRoot(
      mockId,
      initialVersion,
      true,
      mockDate,
    );

    expect(aggregate).toBeDefined();
    expect(aggregate.id).toBe(mockId);
    expect(aggregate.version.value).toBe(1);
    expect(aggregate.isActive).toBe(true);
  });

  it('should increment the version by 1 when incrementVersion is called', () => {
    const aggregate = new TestAggregateRoot(
      mockId,
      initialVersion,
      true,
      mockDate,
    );
    aggregate.incrementVersion();

    expect(aggregate.version.value).toBe(2);
    expect(aggregate.version).toBeInstanceOf(BaseVersion);
  });
});
