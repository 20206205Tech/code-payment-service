import { InvalidVersionException } from '../exceptions/invalid-version.exception';
import { BaseVersion } from './base-version';

describe('BaseVersion', () => {
  it('should create an instance with a valid value (e.g., 1)', () => {
    const version = new BaseVersion(1);
    expect(version).toBeDefined();
    expect(version.value).toBe(1);
  });

  it('should create an instance with a value greater than the minimum', () => {
    const version = new BaseVersion(10);
    expect(version.value).toBe(10);
  });

  it('should throw InvalidVersionException if the version is less than 1', () => {
    // Check with zero
    expect(() => new BaseVersion(0)).toThrow(InvalidVersionException);

    // Check with negative numbers
    expect(() => new BaseVersion(-5)).toThrow(InvalidVersionException);
  });

  describe('equals()', () => {
    it('should return true when comparing two versions with the same value', () => {
      const v1 = new BaseVersion(2);
      const v2 = new BaseVersion(2);
      expect(v1.equals(v2)).toBe(true);
    });

    it('should return false when comparing two versions with different values', () => {
      const v1 = new BaseVersion(1);
      const v2 = new BaseVersion(2);
      expect(v1.equals(v2)).toBe(false);
    });

    it('should return false when comparing with null or undefined', () => {
      const v1 = new BaseVersion(1);
      expect(v1.equals(null as unknown as BaseVersion)).toBe(false);
      expect(v1.equals(undefined as unknown as BaseVersion)).toBe(false);
    });
  });
});
