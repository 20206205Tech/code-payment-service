export const PAYMENT_QUEUE = `${process.env.ENVIRONMENT}_payment_queue`;
export const PAYMENT_TIMEOUT_QUEUE = `${process.env.ENVIRONMENT}_payment-timeout`;
export const PAYMENT_TIMEOUT_MS = 3 * 60000; // 3 minutes

export const SUBSCRIPTION_EXPIRATION_WARNING_DAYS = 7; // Số ngày trước khi hết hạn sẽ gửi email cảnh báo
