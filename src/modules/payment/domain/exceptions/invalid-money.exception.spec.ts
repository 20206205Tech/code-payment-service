import { DomainException } from '@20206205tech/nestjs-common';
import { InvalidMoneyException } from './invalid-money.exception';

describe('InvalidMoneyException', () => {
  it('should include value in the message', () => {
    const ex = new InvalidMoneyException(0);
    expect(ex.message).toContain('0');
  });

  it('should be an instance of DomainException', () => {
    const ex = new InvalidMoneyException(0);
    expect(ex).toBeInstanceOf(DomainException);
  });

  it('should be an instance of Error', () => {
    const ex = new InvalidMoneyException(0);
    expect(ex).toBeInstanceOf(Error);
  });

  it('should have name "InvalidMoneyException"', () => {
    const ex = new InvalidMoneyException(0);
    expect(ex.name).toBe('InvalidMoneyException');
  });
});
