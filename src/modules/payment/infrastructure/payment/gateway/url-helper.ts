import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '../payment-provider.enum';

export const getBaseExternalUrl = (configService: ConfigService): string => {
  const serviceName = 'code-payment-service';
  const environment = configService.get<string>('ENVIRONMENT', 'production');

  const domain =
    environment === 'production'
      ? `${serviceName}.20206205.tech`
      : `dev-${serviceName}.20206205.tech`;

  return `https://${domain}/${serviceName}`;
};

export const getPaymentCallbackUrl = (
  configService: ConfigService,
  provider: PaymentProvider,
): string => {
  return `${getBaseExternalUrl(configService)}/subscriptions/payment-callback/${provider}`;
};

export const getPaymentReturnUrl = (
  configService: ConfigService,
  provider: PaymentProvider,
): string => {
  return `${getBaseExternalUrl(configService)}/subscriptions/payment-return/${provider}`;
};
