export const EMAIL_SENDER_PORT = Symbol('EMAIL_SENDER_PORT');

export interface EmailSenderPort {
  sendPaymentSuccessEmail(
    email: string,
    name: string,
    planId: string,
    txnRef: string,
  ): Promise<void>;

  sendSubscriptionExpirationWarningEmail(
    email: string,
    name: string,
    planName: string,
    daysRemaining: number,
  ): Promise<void>;

  sendSubscriptionExpiredEmail(
    email: string,
    name: string,
    planName: string,
  ): Promise<void>;
}
