export const PAYMENT_QUEUE = `${process.env.ENVIRONMENT}_payment_queue`;
export const PAYMENT_TIMEOUT_QUEUE = `${process.env.ENVIRONMENT}_payment-timeout`;
export const PAYMENT_TIMEOUT_MS = 3 * 60000; // 3 minutes
