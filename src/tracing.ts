import { initTracing as initBaseTracing } from '@20206205tech/nestjs-common';

export const initTracing = () => {
  initBaseTracing('code-payment-service');
};
