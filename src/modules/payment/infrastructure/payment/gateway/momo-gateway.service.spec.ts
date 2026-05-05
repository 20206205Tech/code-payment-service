import { MomoGatewayService } from './momo-gateway.service';
import { ConfigService } from '@nestjs/config';

describe('MomoGatewayService', () => {
  it('should be defined when provided a ConfigService', () => {
    const mockConfig = {
      getOrThrow: jest.fn().mockReturnValue('mock-value'),
      get: jest.fn().mockReturnValue('development'),
    } as unknown as ConfigService;

    const service = new MomoGatewayService(mockConfig);
    expect(service).toBeDefined();
  });
});
