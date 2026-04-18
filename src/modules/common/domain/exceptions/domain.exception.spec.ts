import { DomainException } from './domain.exception';

describe('DomainException', () => {
  it('should initialize correctly with the provided message and class name', () => {
    const errorMessage = 'An unexpected domain error occurred';
    const exception = new DomainException(errorMessage);

    expect(exception).toBeDefined();
    expect(exception).toBeInstanceOf(Error);
    expect(exception.message).toBe(errorMessage);
    expect(exception.name).toBe('DomainException');
    expect(exception.stack).toBeDefined();
  });
});
