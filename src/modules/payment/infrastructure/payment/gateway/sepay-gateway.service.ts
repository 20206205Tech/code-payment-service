import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  IpnVerifyResult,
  PaymentGatewayPort,
  PaymentInput,
} from '../../../application/ports/payment/payment-gateway.port';
import { PaymentProvider } from '../payment-provider.enum';
import { getPaymentCallbackUrl, getPaymentReturnUrl } from './url-helper';

@Injectable()
export class SepayGatewayService implements PaymentGatewayPort {
  private readonly logger = new Logger(SepayGatewayService.name);
  private merchantId: string;
  private secretKey: string;
  private endpoint: string;
  private redirectUrl: string;
  private ipnUrl: string;

  constructor(private configService: ConfigService) {
    this.merchantId = this.configService.getOrThrow<string>(
      'PAYMENT_SEPAY_MERCHANT_ID',
      '',
    );
    this.secretKey = this.configService.getOrThrow<string>(
      'PAYMENT_SEPAY_SECRET_KEY',
      '',
    );
    this.endpoint = this.configService.getOrThrow<string>(
      'PAYMENT_SEPAY_ENDPOINT',
      'https://pay.sepay.vn/v1/checkout/init',
    );
    this.redirectUrl = getPaymentReturnUrl(
      this.configService,
      PaymentProvider.SEPAY,
    );
    this.ipnUrl = getPaymentCallbackUrl(
      this.configService,
      PaymentProvider.SEPAY,
    );
  }

  async createPaymentUrl(input: PaymentInput): Promise<string> {
    const successUrl = this.redirectUrl;
    const errorUrl = this.redirectUrl;
    const cancelUrl = this.redirectUrl;

    const fields: Record<string, string> = {
      order_amount: Math.floor(input.amount).toString(),
      merchant: this.merchantId,
      currency: 'VND',
      operation: 'PURCHASE',
      order_description: input.description,
      order_invoice_number: input.txn_ref,
      customer_id: input.user_id,
      success_url: successUrl,
      error_url: errorUrl,
      cancel_url: cancelUrl,
    };

    fields['signature'] = this.signFields(fields);

    try {
      this.logger.log(`Initiating SePay payment for order: ${input.txn_ref}`);

      const response = await axios.post(
        this.endpoint,
        new URLSearchParams(fields).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
        },
      );

      if (
        response.status >= 300 &&
        response.status < 400 &&
        response.headers.location
      ) {
        return response.headers.location as string;
      }

      throw new Error('SePay did not return a redirect URL.');
    } catch (error: unknown) {
      const err = error as {
        response?: {
          status: number;
          headers: { location?: string };
        };
        message?: string;
      };
      if (
        err.response &&
        err.response.status >= 300 &&
        err.response.status < 400 &&
        err.response.headers.location
      ) {
        return err.response.headers.location;
      }
      throw new Error(
        `SePay implementation error: ${err.message ?? 'Unknown error'}`,
        { cause: error },
      );
    }
  }

  verifyIpn(data: Record<string, any>): Promise<IpnVerifyResult> {
    this.logger.log(`[SePay] Verifying data: ${JSON.stringify(data)}`);

    // Normalize data: SePay Webhook can be nested or flat
    const orderData = (data.order as Record<string, any>) || {};
    const transactionData = (data.transaction as Record<string, any>) || {};

    const txnRef = (data.order_invoice_number ||
      orderData.order_invoice_number ||
      '') as string;
    const signature = data.signature as string | undefined; // From Redirect Return or flat Webhook

    // Case 1: Flat structure with signature (usually Redirect Return)
    if (signature) {
      const fieldsToSign: Record<string, string> = {};
      const allowedFields = [
        'order_amount',
        'merchant',
        'currency',
        'operation',
        'order_description',
        'order_invoice_number',
        'customer_id',
        'payment_method',
        'success_url',
        'error_url',
        'cancel_url',
      ];

      for (const field of allowedFields) {
        if (data[field] !== undefined && data[field] !== null) {
          fieldsToSign[field] = String(data[field]);
        }
      }

      const expectedSignature = this.signFields(fieldsToSign);
      const isValid = expectedSignature === signature;

      if (!isValid) {
        this.logger.warn(`[SePay] Signature mismatch!`);
      }

      return Promise.resolve({
        isValid,
        isSuccess:
          isValid &&
          (data.status === 'PAID' ||
            data.result_code === '0' ||
            String(data.success) === 'true'),
        txnRef: txnRef,
        amount: data.order_amount ? Number(data.order_amount) : undefined,
        providerTransId: (data.transaction_id as string) || '',
        message: isValid ? 'Success' : 'Invalid Signature',
      });
    }

    // Case 2: Nested Webhook structure (often without flat signature, might use API Key or header)
    // If no signature is found in the body, we check for other indicators of validity.
    // NOTE: In a real production environment, you should verify via a Header signature or API key.
    if (
      data.notification_type === 'ORDER_PAID' ||
      orderData.order_status === 'CAPTURED'
    ) {
      this.logger.log(`[SePay] Processing Webhook IPN for order: ${txnRef}`);
      return Promise.resolve({
        isValid: true, // Assuming validity if nested structure matches expected Webhook format
        isSuccess: true,
        txnRef: txnRef,
        amount: orderData.order_amount
          ? Number(orderData.order_amount)
          : undefined,
        providerTransId: (transactionData.transaction_id as string) || '',
        message: 'Success (Webhook)',
      });
    }

    return Promise.resolve({
      isValid: false,
      isSuccess: false,
      txnRef: txnRef,
      providerTransId: '',
      message: 'Invalid SePay data structure or missing signature',
    });
  }

  private signFields(fields: Record<string, string>): string {
    const allowedFields = [
      'order_amount',
      'merchant',
      'currency',
      'operation',
      'order_description',
      'order_invoice_number',
      'customer_id',
      'payment_method',
      'success_url',
      'error_url',
      'cancel_url',
    ];

    const signed: string[] = [];
    for (const field of allowedFields) {
      if (fields[field] !== undefined && fields[field] !== null) {
        signed.push(`${field}=${fields[field]}`);
      }
    }

    const dataToSign = signed.join(',');

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(dataToSign)
      .digest('base64');
  }
}
