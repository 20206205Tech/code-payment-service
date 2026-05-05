import { VnpayGatewayService } from './vnpay-gateway.service';
import { ConfigService } from '@nestjs/config';
import { VnpayService as NestjsVnpayService } from 'nestjs-vnpay';

describe('VnpayGatewayService', () => {
  it('should be defined when provided mocked dependencies', () => {
    const mockVnpay = {} as unknown as jest.Mocked<NestjsVnpayService>;
    const mockConfig = {
      getOrThrow: jest.fn().mockReturnValue('mock-value'),
      get: jest.fn().mockReturnValue('development'),
    } as unknown as ConfigService;

    const service = new VnpayGatewayService(mockVnpay, mockConfig);
    expect(service).toBeDefined();
  });
});
