import { DomainException } from './domain.exception';
import { InvalidVersionException } from './invalid-version.exception';

describe('InvalidVersionException', () => {
  it('should generate the correct error message regarding the version boundary', () => {
    const value = -1;
    const min = 1;

    const exception = new InvalidVersionException(value, min);

    expect(exception).toBeInstanceOf(DomainException);
    expect(exception.message).toBe(
      'Invalid version value: -1. Must be greater than or equal to 1.',
    );
    expect(exception.name).toBe('InvalidVersionException');
  });
});
