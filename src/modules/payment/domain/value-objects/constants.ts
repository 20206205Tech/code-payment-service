export const PAYMENT_QUEUE = `${process.env.ENVIRONMENT}_payment_queue`;
export const PAYMENT_TIMEOUT_QUEUE = `${process.env.ENVIRONMENT}_payment-timeout`;
export const PAYMENT_TIMEOUT_MS = 10 * 60000; // 3 minutes
export const PLAN_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function getPlanCacheNamespace(
  environment = process.env.ENVIRONMENT ?? 'production',
): string {
  return `${environment}_payment:plans`;
}

export function getPlanCachePrefix(
  environment = process.env.ENVIRONMENT ?? 'production',
): string {
  return `${getPlanCacheNamespace(environment)}`;
}

export const SUBSCRIPTION_EXPIRATION_WARNING_DAYS = 7; // Số ngày trước khi hết hạn sẽ gửi email cảnh báo

export const DEFAULT_PLAN_FEATURES = [
  'Sử dụng suy luận',
  'Sử dụng voice',
  'Xử lý tài liệu riêng',
];
