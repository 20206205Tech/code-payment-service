import { DomainException } from '@20206205tech/nestjs-common';

export class TransactionAlreadyProcessedException extends DomainException {
  constructor(transactionId: string) {
    super(`Giao dịch "${transactionId}" đã được xử lý thành công từ trước.`);
  }
}
