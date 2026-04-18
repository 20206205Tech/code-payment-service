import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompressionTypes, Kafka, Producer } from 'kafkajs';
import {
  MessageBrokerPort,
  SubscriptionPurchasedPayload,
} from '../../application/ports/service/message-broker.port';

@Injectable()
export class KafkaMessageBrokerAdapter
  implements MessageBrokerPort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(KafkaMessageBrokerAdapter.name);
  private readonly producer: Producer;

  private static readonly TOPIC_SUBSCRIPTION_PURCHASED =
    process.env.NODE_ENV === 'development'
      ? 'dev-payment-events'
      : 'prod-payment-events';

  constructor(private readonly configService: ConfigService) {
    // 1. Lấy toàn bộ các chứng chỉ cần thiết từ Doppler
    const caRaw = this.configService.getOrThrow<string>('KAFKA_SSL_CA');
    const certRaw = this.configService.getOrThrow<string>('KAFKA_SSL_CERT');
    const keyRaw = this.configService.getOrThrow<string>('KAFKA_SSL_KEY');

    // 2. Chuẩn hóa lại các ký tự escape newlines từ Doppler
    const ca = caRaw.replace(/\\n/g, '\n');
    const cert = certRaw.replace(/\\n/g, '\n');
    const key = keyRaw.replace(/\\n/g, '\n');

    const kafka = new Kafka({
      clientId: 'payment-service',
      brokers: [this.configService.getOrThrow<string>('KAFKA_BROKER')],
      ssl: {
        ca: [ca],
        cert: cert, // Thêm Client Certificate
        key: key, // Thêm Client Key
        rejectUnauthorized: true,
      },
      // sasl: {
      //   mechanism: 'scram-sha-256',
      //   username: this.configService.getOrThrow<string>('KAFKA_USERNAME'),
      //   password: this.configService.getOrThrow<string>('KAFKA_PASSWORD'),
      // },
    });

    this.producer = kafka.producer({
      allowAutoTopicCreation: false,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    this.logger.log('Kafka producer connected to Aiven');
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
    this.logger.log('Kafka producer disconnected');
  }

  async publishSubscriptionPurchased(
    payload: SubscriptionPurchasedPayload,
  ): Promise<void> {
    await this.producer.send({
      topic: KafkaMessageBrokerAdapter.TOPIC_SUBSCRIPTION_PURCHASED,
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key: payload.userId,
          value: JSON.stringify({
            ...payload,
            startDate: payload.startDate.toISOString(),
            endDate: payload.endDate.toISOString(),
            occurredAt: new Date().toISOString(),
          }),
        },
      ],
    });

    this.logger.log(
      `📨 Kafka [${KafkaMessageBrokerAdapter.TOPIC_SUBSCRIPTION_PURCHASED}]: published for userId=${payload.userId}, subscriptionId=${payload.subscriptionId}`,
    );
  }
}
