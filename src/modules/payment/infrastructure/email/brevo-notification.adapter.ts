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
  // private readonly emailAddressDev: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new BrevoClient({
      apiKey: this.configService.getOrThrow<string>('BREVO_API_KEY'),
    });
    // this.senderName = this.configService.getOrThrow<string>('EMAIL_NAME');
    // this.senderEmail = this.configService.getOrThrow<string>('EMAIL_ADDRESS');
    this.senderName =
      this.configService.get<string>('EMAIL_NAME') ||
      '(20206205.tech) AI Chatbot - Support';
    this.senderEmail =
      this.configService.get<string>('EMAIL_ADDRESS') ||
      'support@20206205.tech';
    // this.emailAddressDev =
    //   this.configService.getOrThrow<string>('EMAIL_ADDRESS_DEV');
  }

  private get siteUrl(): string {
    return process.env.ENVIRONMENT === 'production'
      ? 'https://20206205.tech'
      : 'http://localhost:3000';
  }

  private generateHtml(
    title: string,
    content: string,
    buttonLabel: string,
    buttonUrl: string,
  ): string {
    return `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #04aa6d;">${title}</h2>
        ${content}
        <br>
        <p style="text-align: center;">
          <a style="background-color: #04aa6d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;" href="${buttonUrl}" target="_blank">
            &#128073; ${buttonLabel}
          </a>
        </p>
        <br>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 14px; color: #666;"><em>Nếu nút bấm không hoạt động, vui lòng copy và dán đường dẫn sau vào trình duyệt:</em></p>
        <p style="font-size: 14px; word-break: break-all; color: #04aa6d;">
          <a href="${buttonUrl}" style="color: #04aa6d;">${buttonUrl}</a>
        </p>
        <p style="font-size: 14px; color: #999; margin-top: 20px;">Trân trọng,<br>Đội ngũ AI Chatbot</p>
      </div>
    `;
  }

  async sendPaymentSuccessEmail(
    email: string,
    name: string,
    planName: string,
    txnRef: string,
  ): Promise<void> {
    try {
      if (process.env.ENVIRONMENT === 'development') {
        // email = this.emailAddressDev || email;
        this.logger.debug(
          `Development mode: Overriding recipient email to ${email} for testing purposes.`,
        );
      }
      const response = await this.client.transactionalEmails.sendTransacEmail({
        subject: 'Xác nhận thanh toán thành công - AI Chatbot',
        htmlContent: this.generateHtml(
          'Thanh toán thành công!',
          `
          <p>Chào <strong>${name}</strong>,</p>
          <p>Cảm ơn bạn đã tin dùng dịch vụ của chúng tôi. Giao dịch mua gói <strong>${planName}</strong> của bạn đã được xử lý thành công.</p>
          <p><strong>Mã giao dịch:</strong> ${txnRef}</p>
          <p>Tài khoản của bạn đã được cập nhật. Hãy truy cập ngay vào AI Chatbot để bắt đầu trải nghiệm nhé.</p>
          `,
          'Truy cập AI Chatbot',
          this.siteUrl,
        ),
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
      if (process.env.ENVIRONMENT === 'development') {
        // email = this.emailAddressDev || email;
      }

      const response = await this.client.transactionalEmails.sendTransacEmail({
        subject: `[Thông báo] Gói dịch vụ của bạn sắp hết hạn - AI Chatbot`,
        htmlContent: this.generateHtml(
          'Gói dịch vụ sắp hết hạn',
          `
          <p>Chào <strong>${name}</strong>,</p>
          <p>Chúng tôi xin thông báo rằng gói dịch vụ <strong>${planName}</strong> của bạn sẽ hết hạn trong vòng <strong>${daysRemaining} ngày</strong> tới.</p>
          <p>Để không bị gián đoạn trong việc sử dụng tính năng cao cấp của AI Chatbot, vui lòng tiến hành gia hạn gói dịch vụ của bạn.</p>
          `,
          'Gia hạn ngay',
          `${this.siteUrl}/plans`,
        ),
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
      if (process.env.ENVIRONMENT === 'development') {
        // email = this.emailAddressDev || email;
      }

      const response = await this.client.transactionalEmails.sendTransacEmail({
        subject: `[Thông báo] Gói dịch vụ của bạn đã hết hạn - AI Chatbot`,
        htmlContent: this.generateHtml(
          'Gói dịch vụ đã hết hạn',
          `
          <p>Chào <strong>${name}</strong>,</p>
          <p>Gói dịch vụ <strong>${planName}</strong> của bạn đã chính thức hết hạn vào hôm nay.</p>
          <p>Các tính năng cao cấp đã tạm thời bị khóa. Bạn vẫn có thể truy cập lại chúng bất cứ lúc nào bằng cách mua gói dịch vụ mới.</p>
          `,
          'Mua gói mới',
          `${this.siteUrl}/plans`,
        ),
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
