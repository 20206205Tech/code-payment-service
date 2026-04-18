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

export interface PaymentGatewayPort {
  createPaymentUrl(input: PaymentInput): Promise<string>;
  verifyIpn(
    data: Record<string, any>,
    provider?: string,
  ): Promise<IpnVerifyResult>;
}
