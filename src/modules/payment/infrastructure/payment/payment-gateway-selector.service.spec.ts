import { Test, TestingModule } from '@nestjs/testing';
import { MomoGatewayService } from './gateway/momo-gateway.service';
import { SepayGatewayService } from './gateway/sepay-gateway.service';
import { VnpayGatewayService } from './gateway/vnpay-gateway.service';
import { ZalopayGatewayService } from './gateway/zalopay-gateway.service';
import { PaymentGatewaySelectorService } from './payment-gateway-selector.service';
import { PaymentProvider } from './payment-provider.enum';

describe('PaymentGatewaySelectorService', () => {
  let service: PaymentGatewaySelectorService;
  let mockMomo: jest.Mocked<MomoGatewayService>;
  let mockZalopay: jest.Mocked<ZalopayGatewayService>;
  let mockVnpay: jest.Mocked<VnpayGatewayService>;
  let mockSepay: jest.Mocked<SepayGatewayService>;

  beforeEach(async () => {
    mockMomo = {
      createPaymentUrl: jest.fn(),
      verifyIpn: jest.fn(),
    } as unknown as jest.Mocked<MomoGatewayService>;
    mockZalopay = {
      createPaymentUrl: jest.fn(),
      verifyIpn: jest.fn(),
    } as unknown as jest.Mocked<ZalopayGatewayService>;
    mockVnpay = {
      createPaymentUrl: jest.fn(),
      verifyIpn: jest.fn(),
    } as unknown as jest.Mocked<VnpayGatewayService>;
    mockSepay = {
      createPaymentUrl: jest.fn(),
      verifyIpn: jest.fn(),
    } as unknown as jest.Mocked<SepayGatewayService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentGatewaySelectorService,
        { provide: MomoGatewayService, useValue: mockMomo },
        { provide: ZalopayGatewayService, useValue: mockZalopay },
        { provide: VnpayGatewayService, useValue: mockVnpay },
        { provide: SepayGatewayService, useValue: mockSepay },
      ],
    }).compile();

    service = module.get<PaymentGatewaySelectorService>(
      PaymentGatewaySelectorService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGateway', () => {
    it('should return Momo gateway when provider is MOMO', () => {
      expect(service.getGateway(PaymentProvider.MOMO)).toBe(mockMomo);
    });

    it('should return Zalopay gateway when provider is ZALOPAY', () => {
      expect(service.getGateway(PaymentProvider.ZALOPAY)).toBe(mockZalopay);
    });

    it('should return Vnpay gateway by default or when provider is VNPAY', () => {
      expect(service.getGateway(PaymentProvider.VNPAY)).toBe(mockVnpay);
      expect(service.getGateway()).toBe(mockVnpay);
    });

    it('should return Sepay gateway when provider is SEPAY', () => {
      expect(service.getGateway(PaymentProvider.SEPAY)).toBe(mockSepay);
    });
  });
});
