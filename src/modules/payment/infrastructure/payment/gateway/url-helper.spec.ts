import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '../payment-provider.enum';
import {
  getBaseExternalUrl,
  getPaymentCallbackUrl,
  getPaymentReturnUrl,
} from './url-helper';

describe('url-helper', () => {
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;
  });

  it('should return production URL when environment is production', () => {
    mockConfigService.get.mockReturnValue('production');
    const url = getBaseExternalUrl(mockConfigService);
    expect(url).toBe(
      'https://code-payment-service.20206205.tech/code-payment-service',
    );
  });

  it('should return dev URL when environment is development', () => {
    mockConfigService.get.mockReturnValue('development');
    const url = getBaseExternalUrl(mockConfigService);
    expect(url).toBe(
      'https://dev-code-payment-service.20206205.tech/code-payment-service',
    );
  });

  it('should return correct callback URL', () => {
    mockConfigService.get.mockReturnValue('production');
    const url = getPaymentCallbackUrl(mockConfigService, PaymentProvider.VNPAY);
    expect(url).toContain('/subscriptions/payment-callback/vnpay');
  });

  it('should return correct return URL', () => {
    mockConfigService.get.mockReturnValue('production');
    const url = getPaymentReturnUrl(mockConfigService, PaymentProvider.VNPAY);
    expect(url).toContain('/subscriptions/payment-return/vnpay');
  });
});
