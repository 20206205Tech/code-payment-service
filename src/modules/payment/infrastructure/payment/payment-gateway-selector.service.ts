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
    // Lưu ý: Provider bây giờ được xác định từ PurchaseSubscriptionCommandHandler
    // thông qua việc chọn gateway cụ thể hoặc truyền hint.
    // Ở đây ta có thể dùng một default provider nếu không có input đặc thù.
    // Tuy nhiên, theo yêu cầu mới, ta nên để Handler tự chọn gateway từ selector này.
    return this.zalopay.createPaymentUrl(input); // Placeholder, thực tế sẽ gọi qua factory
  }

  /**
   * Factory method để lấy gateway tương ứng với provider name
   */
  getGateway(provider?: string): PaymentGatewayPort {
    const p = provider?.toLowerCase();
    if (p === 'momo') return this.momo;
    if (p === 'zalo' || p === 'zalopay') return this.zalopay;
    if (p === 'vnpay') return this.vnpay;
    if (p === 'sepay') return this.sepay;

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
