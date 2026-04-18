import { DomainException } from '../../../common/domain/exceptions/domain.exception';

export class PaymentFailedException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
