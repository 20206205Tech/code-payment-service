import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { PaymentProvider } from '../payment-provider.enum';
import {
  IpnVerifyResult,
  PaymentGatewayPort,
  PaymentInput,
} from '../../../application/ports/payment/payment-gateway.port';
import { getPaymentCallbackUrl, getPaymentReturnUrl } from './url-helper';

interface MomoPaymentResponse {
  payUrl?: string;
  message?: string;
}

@Injectable()
export class MomoGatewayService implements PaymentGatewayPort {
  private partnerCode: string;
  private accessKey: string;
  private secretKey: string;
  private endpoint: string;
  private redirectUrl: string;
  private ipnUrl: string;

  constructor(private configService: ConfigService) {
    this.partnerCode = this.configService.getOrThrow<string>(
      'PAYMENT_MOMO_PARTNER_CODE',
    );
    this.accessKey = this.configService.getOrThrow<string>(
      'PAYMENT_MOMO_ACCESS_KEY',
    );
    this.secretKey = this.configService.getOrThrow<string>(
      'PAYMENT_MOMO_SECRET_KEY',
    );
    this.endpoint = this.configService.getOrThrow<string>(
      'PAYMENT_MOMO_ENDPOINT',
    );
    this.redirectUrl = getPaymentReturnUrl(
      this.configService,
      PaymentProvider.MOMO,
    );
    this.ipnUrl = getPaymentCallbackUrl(
      this.configService,
      PaymentProvider.MOMO,
    );
  }

  async createPaymentUrl(input: PaymentInput): Promise<string> {
    const requestId = input.txn_ref;
    const orderId = input.txn_ref;
    const amount = Math.floor(input.amount).toString();
    const orderInfo = input.description;
    const requestType = 'payWithMethod';
    const extraData = '';

    const ipnUrl = this.ipnUrl;
    const redirectUrl = this.redirectUrl;

    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.partnerCode,
      partnerName: 'Test Merchant',
      storeId: 'MomoTestStore',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData,
      // orderExpireTime: 1,
      signature,
    };

    const response = await axios.post<MomoPaymentResponse>(
      this.endpoint,
      requestBody,
    );

    if (response.data?.payUrl) {
      return response.data.payUrl;
    }

    throw new Error(`MoMo error: ${response.data.message ?? 'Unknown error'}`);
  }

  verifyIpn(data: Record<string, any>): Promise<IpnVerifyResult> {
    const signature = String(data.signature || '');

    // Danh sách các trường cần thiết để tạo chữ ký verify theo thứ tự của MoMo
    // Lưu ý: data[key] có thể là number, cần convert sang string
    const amount = String(data.amount ?? '');
    const extraData = String(data.extraData ?? '');
    const message = String(data.message ?? '');
    const orderId = String(data.orderId ?? '');
    const orderInfo = String(data.orderInfo ?? '');
    const orderType = String(data.orderType ?? '');
    const partnerCode = String(data.partnerCode ?? '');
    const payType = String(data.payType ?? '');
    const requestId = String(data.requestId ?? '');
    const responseTime = String(data.responseTime ?? '');
    const resultCode = String(data.resultCode ?? '');
    const transId = String(data.transId ?? '');

    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const isValid = expectedSignature === signature;

    const logger = new Logger(MomoGatewayService.name);
    logger.log(`Verifying MoMo IPN for orderId: ${orderId}`);
    logger.debug(`Raw Signature: ${rawSignature}`);
    logger.debug(`Expected Signature: ${expectedSignature}`);
    logger.debug(`Received Signature: ${signature}`);
    logger.log(`Verification result: ${isValid ? 'SUCCESS' : 'FAILED'}`);

    if (!isValid) {
      logger.warn(
        `Signature Mismatch! SecretKey: ${this.secretKey.slice(0, 4)}... AccessKey: ${this.accessKey.slice(0, 4)}...`,
      );
    }

    const isSuccess = resultCode === '0';

    return Promise.resolve({
      isValid,
      isSuccess,
      txnRef: orderId,
      amount: amount ? Number(amount) : undefined,
      providerTransId: transId,
      message: message || (isSuccess ? 'Success' : `MoMo Error: ${resultCode}`),
    });
  }
}
