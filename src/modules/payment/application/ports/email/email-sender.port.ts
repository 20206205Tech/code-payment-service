// export class EmailSenderPort {}

// application/ports/service/notification.port.ts

export const EMAIL_SENDER_PORT = Symbol('EMAIL_SENDER_PORT');

export interface EmailSenderPort {
  sendPaymentSuccessEmail(
    email: string,
    name: string,
    planId: string,
    txnRef: string,
  ): Promise<void>;
}
