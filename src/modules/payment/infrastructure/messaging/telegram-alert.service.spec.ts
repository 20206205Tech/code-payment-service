// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import * as os from 'node:os';
//
// interface DLQAlertPayload {
//   event: string;
//   subscriptionId?: string;
//   userId?: string;
//   version?: number;
//   totalAttempts: number;
//   maxRetries: number;
//   errorMessage?: string;
//   payload: unknown;
// }
//
// @Injectable()
// export class TelegramAlertService {
//   private readonly logger = new Logger(TelegramAlertService.name);
//   private readonly telegramBotToken: string;
//   private readonly telegramChatId: string;
//   private readonly environment: string;
//   private readonly serviceName = 'payment-service';
//
//   constructor(private readonly configService: ConfigService) {
//     this.telegramBotToken = this.configService.get<string>(
//       'TELEGRAM_BOT_TOKEN',
//       '',
//     );
//     this.telegramChatId = this.configService.get<string>(
//       'TELEGRAM_ALERT_CHAT_ID',
//       '-5156220357',
//     );
//     this.environment = this.configService.get<string>('ENVIRONMENT', 'dev');
//   }
//
//   async sendDLQAlert(data: DLQAlertPayload): Promise<void> {
//     if (!this.telegramBotToken || !this.telegramChatId) {
//       this.logger.warn(
//         '⚠️  Telegram credentials not configured, skipping alert',
//       );
//       return;
//     }
//
//     try {
//       const timestamp = new Date().toISOString();
//       const hostname = os.hostname();
//
//       const message = this.formatMessage({
//         ...data,
//         timestamp,
//         hostname,
//       });
//
//       const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
//
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           chat_id: this.telegramChatId,
//           text: message,
//           parse_mode: 'Markdown',
//         }),
//       });
//
//       if (response.ok) {
//         this.logger.log(`📣 Sent Telegram alert: ${data.event}`);
//       } else {
//         const errorText = await response.text();
//         this.logger.error(
//           `Telegram API error ${response.status}: ${errorText}`,
//         );
//       }
//     } catch (error) {
//       this.logger.error(`Failed to send Telegram alert: ${error}`);
//     }
//   }
//
//   private formatMessage(
//     data: DLQAlertPayload & { timestamp: string; hostname: string },
//   ): string {
//     const {
//       event,
//       subscriptionId,
//       userId,
//       version,
//       totalAttempts,
//       maxRetries,
//       errorMessage,
//       payload,
//       timestamp,
//       hostname,
//     } = data;
//
//     const jsonDetail = JSON.stringify(payload, null, 2);
//
//     return `💀 *DLQ ALERT* — \`${this.environment.toUpperCase()}\`
// ━━━━━━━━━━━━━━━━━━━━
// 🕐 *Thời gian:* \`${timestamp}\`
// ⚙️ *Service:* \`${this.serviceName}\`
// 📋 *Event:* \`${event}\`
//
// 📦 *Kafka Info*
//   • Topic: \`${this.environment}-payment-events\`
//   • DLQ: \`${this.environment}-payment-events-dlq\`
//   • Max retries: \`${maxRetries}\`
//   • Số lần thất bại: \`${totalAttempts}/${maxRetries}\`
//
// 🔍 *Payload*
//   • subscription\\_id: \`${subscriptionId || 'N/A'}\`
//   • user\\_id: \`${userId || 'N/A'}\`
//   • version: \`${version || 'N/A'}\`
//   • Host: \`${hostname}\`
//
// ${errorMessage ? `❌ *Error:* \`${errorMessage}\`\n` : ''}
// \`\`\`json
// ${jsonDetail}
// \`\`\``;
//   }
// }
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const mockHostname = jest.fn(() => 'test-host');

jest.mock('node:os', () => ({
  hostname: mockHostname,
}));

import { TelegramAlertService } from './telegram-alert.service';

describe('TelegramAlertService', () => {
  let configService: jest.Mocked<ConfigService>;
  let service: TelegramAlertService;
  let warnSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    fetchSpy = jest.spyOn(
      globalThis as typeof globalThis & { fetch: typeof fetch },
      'fetch',
    );
    mockHostname.mockReturnValue('test-host');

    (configService.get as jest.Mock).mockImplementation(
      (key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          TELEGRAM_BOT_TOKEN: 'bot-token',
          TELEGRAM_ALERT_CHAT_ID: '-1001234567890',
          ENVIRONMENT: 'test',
        };

        return config[key] ?? defaultValue;
      },
    );

    service = new TelegramAlertService(configService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should skip alert when credentials are missing', async () => {
    (configService.get as jest.Mock).mockImplementation(
      (key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          TELEGRAM_BOT_TOKEN: '',
          TELEGRAM_ALERT_CHAT_ID: '',
          ENVIRONMENT: 'test',
        };

        return config[key] ?? defaultValue;
      },
    );

    service = new TelegramAlertService(configService);

    await service.sendDLQAlert({
      event: 'subscription.purchased',
      totalAttempts: 3,
      maxRetries: 5,
      payload: { id: 'payload-1' },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      '⚠️  Telegram credentials not configured, skipping alert',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should send formatted Telegram alert when request succeeds', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn(),
    } as unknown as Response);

    await service.sendDLQAlert({
      event: 'subscription.purchased',
      subscriptionId: 'sub-1',
      userId: 'user-1',
      version: 2,
      totalAttempts: 1,
      maxRetries: 5,
      payload: { id: 'payload-1' },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const requestBody = JSON.parse(
      (fetchSpy.mock.calls[0][1] as RequestInit).body as string,
    ) as { chat_id: string; text: string; parse_mode: string };

    expect(requestBody.chat_id).toBe('-1001234567890');
    expect(requestBody.parse_mode).toBe('Markdown');
    expect(requestBody.text).toContain('*DLQ ALERT*');
    expect(requestBody.text).toContain('TEST');
    expect(requestBody.text).toContain('subscription.purchased');
    expect(requestBody.text).toContain('sub-1');
    expect(requestBody.text).toContain('user-1');
    expect(requestBody.text).toContain('test-host');
    expect(logSpy).toHaveBeenCalledWith(
      '📣 Sent Telegram alert: subscription.purchased',
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('should log Telegram API errors on non-ok response', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('boom'),
    } as unknown as Response);

    await service.sendDLQAlert({
      event: 'subscription.purchased',
      totalAttempts: 2,
      maxRetries: 5,
      payload: { id: 'payload-1' },
    });

    expect(errorSpy).toHaveBeenCalledWith('Telegram API error 500: boom');
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should log failure when fetch throws', async () => {
    fetchSpy.mockRejectedValue(new Error('network down'));

    await service.sendDLQAlert({
      event: 'subscription.purchased',
      totalAttempts: 2,
      maxRetries: 5,
      payload: { id: 'payload-1' },
    });

    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to send Telegram alert: Error: network down',
    );
  });
});
