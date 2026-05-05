import { DomainException } from '@20206205tech/nestjs-common';

export class TransactionNotFoundException extends DomainException {
  constructor(transactionId?: string) {
    const message = transactionId
      ? `Giao dịch với ID/Ref "${transactionId}" không tồn tại.`
      : 'Không tìm thấy giao dịch yêu cầu.';
    super(message);
  }
}
