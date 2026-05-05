import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VnpayService as NestjsVnpayService } from 'nestjs-vnpay';
import {
  dateFormat,
  ProductCode,
  ReturnQueryFromVNPay,
  VerifyReturnUrl,
  VnpLocale,
} from 'vnpay';
import { PaymentProvider } from '../payment-provider.enum';
import {
  IpnVerifyResult,
  PaymentGatewayPort,
  PaymentInput,
} from '../../../application/ports/payment/payment-gateway.port';
import { getPaymentReturnUrl } from './url-helper';

@Injectable()
export class VnpayGatewayService implements PaymentGatewayPort {
  private readonly logger = new Logger(VnpayGatewayService.name);
  constructor(
    private readonly vnpay: NestjsVnpayService,
    private readonly configService: ConfigService,
  ) {}

  createPaymentUrl(input: PaymentInput): Promise<string> {
    const createDate = new Date();
    const expireDate = new Date();
    expireDate.setMinutes(createDate.getMinutes() + 5);

    const returnUrl = getPaymentReturnUrl(
      this.configService,
      PaymentProvider.VNPAY,
    );

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

  async verifyIpn(data: Record<string, any>): Promise<IpnVerifyResult> {
    const vnpQuery = data as ReturnQueryFromVNPay;
    try {
      this.logger.debug(
        'Verifying VNPay IPN/Return with data:',
        JSON.stringify(data),
      );
      // 1. Chỉ lấy các tham số bắt đầu bằng vnp_ và đảm bảo là chuỗi
      const vnpayData: Record<string, string> = {};
      Object.keys(data).forEach((key) => {
        if (key.startsWith('vnp_')) {
          vnpayData[key] = String(data[key]);
        }
      });
      // 2. Sử dụng thư viện để kiểm tra
      const verifyResult: VerifyReturnUrl = await this.vnpay.verifyReturnUrl(
        vnpayData as unknown as ReturnQueryFromVNPay,
      );

      this.logger.debug(
        'VNPay verification result:',
        JSON.stringify(verifyResult),
      );
      const isSuccess =
        String(vnpQuery.vnp_ResponseCode) === '00' &&
        String(vnpQuery.vnp_TransactionStatus) === '00';
      return {
        isValid: verifyResult.isVerified,
        isSuccess: isSuccess,
        txnRef: String(vnpQuery.vnp_TxnRef ?? ''),
        amount: vnpQuery.vnp_Amount
          ? Number(vnpQuery.vnp_Amount) / 100
          : undefined,
        providerTransId: String(vnpQuery.vnp_TransactionNo ?? ''),
        message: verifyResult.isVerified
          ? isSuccess
            ? 'Success'
            : `VNPay Error Code: ${String(vnpQuery.vnp_ResponseCode)}`
          : verifyResult.message || 'Chữ ký không hợp lệ',
      };
    } catch (error) {
      this.logger.error('VNPay verification error:', error);
      return {
        isValid: false,
        isSuccess: false,
        txnRef: String(vnpQuery.vnp_TxnRef ?? ''),
        providerTransId: String(vnpQuery.vnp_TransactionNo ?? ''),
        message:
          error instanceof Error ? error.message : 'Lỗi xác thực chữ ký VNPay',
      };
    }
  }

  //   verifyIpn(data: Record<string, any>): Promise<IpnVerifyResult> {
  //   // 1. Chuyển đổi các giá trị query string về đúng kiểu dữ liệu
  //   const vnpayData = {
  //     ...data,
  //     vnp_Amount: data.vnp_Amount ? Number(data.vnp_Amount) : 0,
  //     // Đảm bảo không có các trường undefined/null lọt vào
  //   };

  //   // 2. Sử dụng thư viện để kiểm tra
  //   // Lưu ý: verifyReturnUrl trả về object có isVerified (tùy version của nestjs-vnpay)
  //   const verifyResult = this.vnpay.verifyReturnUrl(vnpayData as any);

  //   const isSuccess = data.vnp_ResponseCode === '00' && data.vnp_TransactionStatus === '00';

  //   return Promise.resolve({
  //     isValid: verifyResult.isVerified, // Nếu vẫn false, hãy kiểm tra vnp_HashSecret trong config
  //     isSuccess: isSuccess,
  //     txnRef: String(data.vnp_TxnRef ?? ''),
  //     providerTransId: String(data.vnp_TransactionNo ?? ''),
  //     message: verifyResult.isVerified
  //       ? (isSuccess ? 'Success' : `VNPay Error Code: ${data.vnp_ResponseCode}`)
  //       : 'Chữ ký không hợp lệ',
  //   });
  // }
}
