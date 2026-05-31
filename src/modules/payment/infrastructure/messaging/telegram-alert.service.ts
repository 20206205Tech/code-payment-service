import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'node:os';

interface DLQAlertPayload {
  event: string;
  subscriptionId?: string;
  userId?: string;
  version?: number;
  totalAttempts: number;
  maxRetries: number;
  errorMessage?: string;
  payload: unknown;
}

@Injectable()
export class TelegramAlertService {
  private readonly logger = new Logger(TelegramAlertService.name);
  private readonly telegramBotToken: string;
  private readonly telegramChatId: string;
  private readonly environment: string;
  private readonly serviceName = 'payment-service';

  constructor(private readonly configService: ConfigService) {
    this.telegramBotToken = this.configService.get<string>(
      'TELEGRAM_BOT_TOKEN',
      '',
    );
    this.telegramChatId = this.configService.get<string>(
      'TELEGRAM_ALERT_CHAT_ID',
      '-5156220357',
    );
    this.environment = this.configService.get<string>('ENVIRONMENT', 'dev');
  }

  async sendDLQAlert(data: DLQAlertPayload): Promise<void> {
    if (!this.telegramBotToken || !this.telegramChatId) {
      this.logger.warn(
        '⚠️  Telegram credentials not configured, skipping alert',
      );
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const hostname = os.hostname();

      const message = this.formatMessage({
        ...data,
        timestamp,
        hostname,
      });

      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      if (response.ok) {
        this.logger.log(`📣 Sent Telegram alert: ${data.event}`);
      } else {
        const errorText = await response.text();
        this.logger.error(
          `Telegram API error ${response.status}: ${errorText}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send Telegram alert: ${error}`);
    }
  }

  private formatMessage(
    data: DLQAlertPayload & { timestamp: string; hostname: string },
  ): string {
    const {
      event,
      subscriptionId,
      userId,
      version,
      totalAttempts,
      maxRetries,
      errorMessage,
      payload,
      timestamp,
      hostname,
    } = data;

    const jsonDetail = JSON.stringify(payload, null, 2);

    return `💀 *DLQ ALERT* — \`${this.environment.toUpperCase()}\`
━━━━━━━━━━━━━━━━━━━━
🕐 *Thời gian:* \`${timestamp}\`
⚙️ *Service:* \`${this.serviceName}\`
📋 *Event:* \`${event}\`

📦 *Kafka Info*
  • Topic: \`${this.environment}-payment-events\`
  • DLQ: \`${this.environment}-payment-events-dlq\`
  • Max retries: \`${maxRetries}\`
  • Số lần thất bại: \`${totalAttempts}/${maxRetries}\`

🔍 *Payload*
  • subscription\\_id: \`${subscriptionId || 'N/A'}\`
  • user\\_id: \`${userId || 'N/A'}\`
  • version: \`${version || 'N/A'}\`
  • Host: \`${hostname}\`

${errorMessage ? `❌ *Error:* \`${errorMessage}\`\n` : ''}
\`\`\`json
${jsonDetail}
\`\`\``;
  }
}
