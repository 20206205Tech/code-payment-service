export const NOTIFICATION_PORT = Symbol('NOTIFICATION_PORT');

export interface NotificationPort {
  sendPaymentSuccessEmail(
    email: string,
    name: string,
    planId: string,
    txnRef: string,
  ): Promise<void>;
}
