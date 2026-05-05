import { SepayGatewayService } from './sepay-gateway.service';
import { ConfigService } from '@nestjs/config';

describe('SepayGatewayService', () => {
  it('should be defined when provided a ConfigService', () => {
    const mockConfig = {
      getOrThrow: jest.fn().mockReturnValue('mock-value'),
      get: jest.fn().mockReturnValue('development'),
    } as unknown as ConfigService;

    const service = new SepayGatewayService(mockConfig);
    expect(service).toBeDefined();
  });
});
