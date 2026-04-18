import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VnpayService as NestjsVnpayService } from 'nestjs-vnpay';
import { ProductCode, VnpLocale, dateFormat } from 'vnpay';
import {
  IpnVerifyResult,
  PaymentGatewayPort,
  PaymentInput,
} from '../../../application/ports/payment/payment-gateway.port';

@Injectable()
export class VnpayGatewayService implements PaymentGatewayPort {
  constructor(
    private readonly vnpay: NestjsVnpayService,
    private readonly configService: ConfigService,
  ) {}

  createPaymentUrl(input: PaymentInput): Promise<string> {
    const createDate = new Date();
    const expireDate = new Date();
    expireDate.setMinutes(createDate.getMinutes() + 5);

    const returnUrl = `${this.configService.getOrThrow<string>('PAYMENT_RETURN_URL')}/vnpay`;

    const url = this.vnpay.buildPaymentUrl({
      vnp_Amount: input.amount,
      vnp_IpAddr: input.client_ip || '127.0.0.1',
      vnp_TxnRef: input.txn_ref,
      vnp_OrderInfo: input.description,
      vnp_OrderType: ProductCode.Other,
      vnp_Locale: VnpLocale.VN,
      vnp_ReturnUrl: returnUrl,
      vnp_CreateDate: dateFormat(createDate),
      vnp_ExpireDate: dateFormat(expireDate),
    });

    return Promise.resolve(url);
  }

  verifyIpn(data: Record<string, any>): Promise<IpnVerifyResult> {
    const isSuccess = data.vnp_ResponseCode === '00';
    // Ép kiểu data về Record<string, string | number> để thỏa mãn type của library nếu cần

    const intermediate: unknown = this.vnpay.verifyReturnUrl(data as any);
    const verifyResult = intermediate as { isVerified: boolean };

    return Promise.resolve({
      isValid: verifyResult.isVerified,
      isSuccess: isSuccess,
      txnRef: String(data.vnp_TxnRef ?? ''),
      providerTransId: String(data.vnp_TransactionNo ?? ''),
      message: isSuccess
        ? 'Success'
        : `VNPay Error: ${data.vnp_ResponseCode as string}`,
    });
  }
}
