import { BrevoClient } from '@getbrevo/brevo';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationPort } from '../../application/ports/service/notification.port';

@Injectable()
export class BrevoNotificationAdapter implements NotificationPort {
  private readonly logger = new Logger(BrevoNotificationAdapter.name);
  private client: BrevoClient;
  private readonly senderName: string;
  private readonly senderEmail: string;
  private readonly emailAddressDev: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new BrevoClient({
      apiKey: this.configService.getOrThrow<string>('BREVO_API_KEY'),
    });
    this.senderName = this.configService.getOrThrow<string>('EMAIL_NAME');
    this.senderEmail = this.configService.getOrThrow<string>('EMAIL_ADDRESS');
    this.emailAddressDev =
      this.configService.getOrThrow<string>('EMAIL_ADDRESS_DEV');
  }

  async sendPaymentSuccessEmail(
    email: string,
    name: string,
    planName: string,
    txnRef: string,
  ): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        email = this.emailAddressDev || email;
        this.logger.debug(
          `Development mode: Overriding recipient email to ${email} for testing purposes.`,
        );
      }
      const response = await this.client.transactionalEmails.sendTransacEmail({
        subject: 'Xác nhận thanh toán thành công - AI Chatbot',
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <h2>Cảm ơn ${name} đã thanh toán!</h2>
              <p>Giao dịch mua gói <strong>${planName}</strong> của bạn đã được xử lý thành công.</p>
              <p><strong>Mã giao dịch:</strong> ${txnRef}</p>
              <hr>
              <p>Tài khoản của bạn đã được cập nhật. Hãy truy cập ngay vào AI Chatbot để trải nghiệm các tính năng mới nhé.</p>
              <p>Nếu có thắc mắc, vui lòng phản hồi lại email này.</p>
            </body>
          </html>
        `,
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email }],
      });

      this.logger.log(
        `Success email sent successfully to ${email}. Message ID: ${response.messageId || 'N/A'}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Error sending success email via Brevo to ${email}:`,
        error,
      );
    }
  }
}
