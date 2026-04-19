import { BrevoClient } from '@getbrevo/brevo';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailSenderPort } from '../../application/ports/email/email-sender.port';

@Injectable()
export class BrevoNotificationAdapter implements EmailSenderPort {
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

  async sendSubscriptionExpirationWarningEmail(
    email: string,
    name: string,
    planName: string,
    daysRemaining: number,
  ): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        email = this.emailAddressDev || email;
      }

      const response = await this.client.transactionalEmails.sendTransacEmail({
        subject: `[Thông báo] Gói dịch vụ của bạn sắp hết hạn - AI Chatbot`,
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
              <h2 style="color: #e67e22;">Xin chào ${name},</h2>
              <p>Chúng tôi xin thông báo rằng gói dịch vụ <strong>${planName}</strong> của bạn sẽ hết hạn trong vòng <strong>${daysRemaining} ngày</strong> tới.</p>
              <p>Để không bị gián đoạn trong việc sử dụng tính năng cao cấp của AI Chatbot, vui lòng tiến hành gia hạn gói dịch vụ của bạn.</p>
              <div style="margin: 20px 0;">
                <a href="#" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Gia hạn ngay</a>
              </div>
              <hr>
              <p>Cảm ơn bạn đã đồng hành cùng AI Chatbot.</p>
              <p>Trân trọng,<br>Đội ngũ AI Chatbot</p>
            </body>
          </html>
        `,
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email }],
      });

      this.logger.log(
        `Expiration warning email sent to ${email}. ID: ${response.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending expiration warning email to ${email}:`,
        error,
      );
    }
  }

  async sendSubscriptionExpiredEmail(
    email: string,
    name: string,
    planName: string,
  ): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        email = this.emailAddressDev || email;
      }

      const response = await this.client.transactionalEmails.sendTransacEmail({
        subject: `[Thông báo] Gói dịch vụ của bạn đã hết hạn - AI Chatbot`,
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
              <h2 style="color: #c0392b;">Chào ${name},</h2>
              <p>Gói dịch vụ <strong>${planName}</strong> của bạn đã chính thức hết hạn vào hôm nay.</p>
              <p>Các tính năng cao cấp đã tạm thời bị khóa. Bạn vẫn có thể truy cập lại chúng bất cứ lúc nào bằng cách mua gói dịch vụ mới.</p>
              <div style="margin: 20px 0;">
                <a href="#" style="background-color: #2ecc71; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Mua gói mới</a>
              </div>
              <hr>
              <p>Hy vọng sớm gặp lại bạn!</p>
              <p>Trân trọng,<br>Đội ngũ AI Chatbot</p>
            </body>
          </html>
        `,
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email }],
      });

      this.logger.log(
        `Expired email sent to ${email}. ID: ${response.messageId}`,
      );
    } catch (error) {
      this.logger.error(`Error sending expired email to ${email}:`, error);
    }
  }
}
