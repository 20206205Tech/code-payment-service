import { Injectable, Logger } from '@nestjs/common';
import {
  IpnVerifyResult,
  PaymentGatewayPort,
  PaymentInput,
} from '../../application/ports/payment/payment-gateway.port';
import { MomoGatewayService } from './gateway/momo-gateway.service';
import { SepayGatewayService } from './gateway/sepay-gateway.service';
import { VnpayGatewayService } from './gateway/vnpay-gateway.service';
import { ZalopayGatewayService } from './gateway/zalopay-gateway.service';
import { PaymentProvider } from './payment-provider.enum';

@Injectable()
export class PaymentGatewaySelectorService implements PaymentGatewayPort {
  private readonly logger = new Logger(PaymentGatewaySelectorService.name);

  constructor(
    private readonly vnpay: VnpayGatewayService,
    private readonly zalopay: ZalopayGatewayService,
    private readonly momo: MomoGatewayService,
    private readonly sepay: SepayGatewayService,
  ) {}

  async createPaymentUrl(input: PaymentInput): Promise<string> {
    const gateway = this.getGateway(input.provider);
    return gateway.createPaymentUrl(input);
  }

  /**
   * Factory method để lấy gateway tương ứng với provider name
   */
  getGateway(provider?: string): PaymentGatewayPort {
    if (provider === PaymentProvider.MOMO) return this.momo;
    if (provider === PaymentProvider.ZALOPAY) return this.zalopay;
    if (provider === PaymentProvider.VNPAY) return this.vnpay;
    if (provider === PaymentProvider.SEPAY) return this.sepay;

    // Mặc định trả về chuẩn hoặc throw lỗi nếu bắt buộc phải có provider
    return this.vnpay;
  }

  async verifyIpn(
    data: Record<string, any>,
    provider?: string,
  ): Promise<IpnVerifyResult> {
    const gateway = this.getGateway(provider);
    this.logger.log(
      `Routing verifyIpn to gateway: ${gateway.constructor.name} (provider: ${provider})`,
    );
    return gateway.verifyIpn(data);
  }
}
