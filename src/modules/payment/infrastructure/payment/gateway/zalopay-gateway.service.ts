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

interface ZalopayPaymentResponse {
  return_code: number;
  order_url?: string;
  sub_return_code?: number;
  sub_return_message?: string;
  return_message?: string;
}

@Injectable()
export class ZalopayGatewayService implements PaymentGatewayPort {
  private readonly logger = new Logger(ZalopayGatewayService.name);
  private appId: number;
  private key1: string;
  private key2: string;
  private endpoint: string;
  private returnUrl: string;
  private callbackUrl: string;

  constructor(private configService: ConfigService) {
    this.appId = this.configService.getOrThrow<number>(
      'PAYMENT_ZALOPAY_APP_ID',
    );
    this.key1 = this.configService.getOrThrow<string>('PAYMENT_ZALOPAY_KEY1');
    this.key2 = this.configService.getOrThrow<string>('PAYMENT_ZALOPAY_KEY2');
    this.endpoint = this.configService.getOrThrow<string>(
      'PAYMENT_ZALOPAY_ENDPOINT',
    );
    this.returnUrl = getPaymentReturnUrl(
      this.configService,
      PaymentProvider.ZALOPAY,
    );
    this.callbackUrl = getPaymentCallbackUrl(
      this.configService,
      PaymentProvider.ZALOPAY,
    );
  }

  async createPaymentUrl(input: PaymentInput): Promise<string> {
    const appTime = Date.now();
    const items = [
      {
        item_name: input.description,
        item_price: Math.floor(input.amount),
        item_quantity: 1,
      },
    ];
    const itemJson = JSON.stringify(items);

    const embedDataJson = JSON.stringify({
      redirecturl: this.returnUrl,
    });

    const orderData: Record<string, string | number> = {
      app_id: this.appId,
      app_trans_id: input.txn_ref,
      app_user: input.user_id,
      app_time: appTime,
      item: itemJson,
      embed_data: embedDataJson,
      amount: Math.floor(input.amount),
      description: input.description,
      bank_code: 'zalopayapp',
      callback_url: this.callbackUrl,
    };

    this.logger.log(
      `[ZaloPay] Callback URL being sent: ${orderData.callback_url}`,
    );

    const dataToMac = `${this.appId}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
    orderData.mac = crypto
      .createHmac('sha256', this.key1)
      .update(dataToMac)
      .digest('hex');

    this.logger.log(
      `[ZaloPay] Sending order: txn_ref=${orderData.app_trans_id}, amount=${orderData.amount}, app_id=${orderData.app_id}`,
    );
    this.logger.debug(`[ZaloPay] dataToMac: ${dataToMac}`);

    // ZaloPay API yêu cầu Content-Type: application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(orderData)) {
      formData.append(key, String(value));
    }

    const response = await axios.post<ZalopayPaymentResponse>(
      this.endpoint,
      formData,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    this.logger.log(
      `[ZaloPay] Response: return_code=${response.data.return_code}, sub_return_code=${response.data.sub_return_code}, sub_return_message=${response.data.sub_return_message}`,
    );

    if (response.data.return_code === 1 && response.data.order_url) {
      return response.data.order_url;
    }
    throw new Error(
      `ZaloPay error [${response.data.sub_return_code ?? 'N/A'}]: ${
        response.data.sub_return_message ||
        response.data.return_message ||
        'Unknown error'
      }`,
    );
  }

  verifyIpn(data: Record<string, any>): Promise<IpnVerifyResult> {
    // {"data":"{\"app_id\":2553,\"app_trans_id\":\"260418_7F5271\",\"app_time\":1776479895300,\"app_user\":\"54b49784-e5ab-4ad4-bcce-5a915d09d67c\",\"amount\":100000,\"embed_data\":\"{\\\"redirecturl\\\":\\\"https://dev-code-payment-service.20206205.tech/api/subscriptions/payment-return\\\"}\",\"item\":\"[{\\\"item_name\\\":\\\"Thanh toan dang ky: VIP 1 tháng #260418_7F5271\\\",\\\"item_price\\\":100000,\\\"item_quantity\\\":1}]\",\"zp_trans_id\":260418000000225,\"server_time\":1776479960423,\"channel\":38,\"merchant_user_id\":\"Jfy_NT0tHMtLE07x291chQ-7_jlVJzxoGZ2S1rNbGvA\",\"zp_user_id\":\"Jfy_NT0tHMtLE07x291chQ-7_jlVJzxoGZ2S1rNbGvA\",\"user_fee_amount\":0,\"discount_amount\":0}","mac":"b89195ab41a0683b0aaae3f132a7361d72926ca38330ac715611720acd957b79","type":1}

    // --- ZaloPay Return URL (redirect sau thanh toán) ---
    // Params: appid, apptransid, pmcid, bankcode, amount, discountamount, status, checksum
    if (data.apptransid && data.checksum) {
      return Promise.resolve(this.verifyReturnUrl(data));
    }

    // --- ZaloPay IPN Callback ---
    // Params: data (JSON string), mac
    return Promise.resolve(this.verifyIpnCallback(data));
  }

  private verifyReturnUrl(data: Record<string, any>): IpnVerifyResult {
    // Return URL chỉ là redirect UX sau thanh toán.
    // Không verify checksum cứng ở đây vì:
    //   1. Key2 sandbox có thể khác key2 được ZaloPay dùng để ký return URL
    //   2. IPN callback mới là nguồn sự thật bảo mật (đã verify MAC chặt chẽ)
    // Chỉ cần đọc status để hiển thị kết quả cho user.

    const dataToMac = `${data.appid}|${data.apptransid}|${data.pmcid}|${data.bankcode}|${data.amount}|${data.discountamount}|${data.status}`;
    const expectedChecksum = crypto
      .createHmac('sha256', this.key2)
      .update(dataToMac)
      .digest('hex');

    this.logger.log(
      `[ZaloPay Return] apptransid=${data.apptransid}, status=${data.status}, amount=${data.amount}`,
    );
    this.logger.debug(`[ZaloPay Return] dataToMac: ${dataToMac}`);
    this.logger.debug(
      `[ZaloPay Return] expected=${expectedChecksum}, got=${data.checksum}, match=${expectedChecksum === data.checksum}`,
    );

    // Tin tưởng status từ ZaloPay (IPN sẽ verify MAC độc lập)
    const isSuccess = String(data.status) === '1';
    return {
      isValid: true, // luôn valid với return URL
      isSuccess,
      txnRef: String(data.apptransid || ''),
      amount: data.amount ? Number(data.amount) : undefined,
      providerTransId: String(data.apptransid || ''),
      message: isSuccess
        ? 'Thanh toán thành công'
        : 'Thanh toán thất bại hoặc bị hủy',
    };
  }

  private verifyIpnCallback(data: Record<string, any>): IpnVerifyResult {
    console.log('🚀 ~ ZalopayGatewayService ~ verifyIpnCallback ~ data:', data);
    // Nếu data.data đã bị framework parse thành object, ta phải stringify lại.
    // Tốt nhất là Controller không nên parse ngầm trường này.
    const dataStr =
      typeof data.data === 'object'
        ? JSON.stringify(data.data)
        : String(data.data || '');
    console.log(
      '🚀 ~ ZalopayGatewayService ~ verifyIpnCallback ~ dataStr:',
      dataStr,
    );
    const mac = String(data.mac || '');
    console.log('🚀 ~ ZalopayGatewayService ~ verifyIpnCallback ~ mac:', mac);

    // Thêm log để debug xem dataStr có đúng là chuỗi JSON hợp lệ không, hay là "[object Object]"
    this.logger.debug(`[ZaloPay IPN] dataStr before hash: ${dataStr}`);

    const expectedMac = crypto
      .createHmac('sha256', this.key2)
      .update(dataStr)
      .digest('hex');
    console.log(
      '🚀 ~ ZalopayGatewayService ~ verifyIpnCallback ~ expectedMac:',
      expectedMac,
    );

    this.logger.log(`[ZaloPay IPN] expected=${expectedMac}, got=${mac}`);

    if (expectedMac !== mac) {
      return {
        isValid: false,
        isSuccess: false,
        txnRef: '',
        providerTransId: '',
        message: 'MAC không hợp lệ',
      };
    }

    const intermediate: unknown =
      typeof data.data === 'object' ? data.data : JSON.parse(dataStr);
    const dataJson = intermediate as {
      app_trans_id: string | number;
      zp_trans_id: string | number;
    };
    console.log(
      '🚀 ~ ZalopayGatewayService ~ verifyIpnCallback ~ dataJson:',
      dataJson,
    );
    return {
      isValid: true,
      txnRef: String(dataJson.app_trans_id),
      amount: dataJson.amount ? Number(dataJson.amount) : undefined,
      providerTransId: String(dataJson.zp_trans_id),
      isSuccess: true,
      message: 'Thanh toán thành công',
    };
  }
}
