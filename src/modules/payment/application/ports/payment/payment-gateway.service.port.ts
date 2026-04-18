// export class PaymentGatewayServicePort {}

//
// // application/ports/payment/payment-gateway.port.ts

//

export const PAYMENT_GATEWAY_PORT = Symbol('PAYMENT_GATEWAY_PORT');

export interface PaymentInput {
  txn_ref: string;
  amount: number;
  description: string;
  client_ip: string;
  user_id: string;
}

export interface IpnVerifyResult {
  isValid: boolean;
  isSuccess: boolean;
  txnRef: string;
  providerTransId: string;
  message: string;
}

export interface PaymentGatewayServicePort {
  createPaymentUrl(method: string, input: PaymentInput): Promise<string>;
  verifyIpn(method: string, data: Record<string, any>): IpnVerifyResult;
}
