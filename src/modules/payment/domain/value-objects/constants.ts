export const PAYMENT_QUEUE = `${process.env.ENVIRONMENT}_payment_queue`;
export const PAYMENT_TIMEOUT_QUEUE = `${process.env.ENVIRONMENT}_payment-timeout`;
// export const PAYMENT_TIMEOUT_MS = 600000; // 10 minutes
export const PAYMENT_TIMEOUT_MS = 5*60000; // 2 minutes
