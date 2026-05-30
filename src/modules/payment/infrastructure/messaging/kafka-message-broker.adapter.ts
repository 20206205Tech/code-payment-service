import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompressionTypes, Kafka, Partitioners, Producer } from 'kafkajs';
import {
  MessageBrokerPort,
  SubscriptionPurchasedPayload,
} from '../../application/ports/messaging/message-broker.port';

@Injectable()
export class KafkaMessageBrokerAdapter
  implements MessageBrokerPort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(KafkaMessageBrokerAdapter.name);
  private readonly producer: Producer;

  private static readonly TOPIC_SUBSCRIPTION_PURCHASED =
    process.env.ENVIRONMENT === 'development'
      ? 'dev-payment-events'
      : 'prod-payment-events';

  constructor(private readonly configService: ConfigService) {
    const kafka = new Kafka({
      clientId: 'payment-service',
      brokers: [this.configService.getOrThrow<string>('KAFKA_BROKER')],
      ssl: {
        ca: [this.configService.getOrThrow<string>('KAFKA_SSL_CA')],
        cert: this.configService.getOrThrow<string>('KAFKA_SSL_CERT'),
        key: this.configService.getOrThrow<string>('KAFKA_SSL_KEY'),
        rejectUnauthorized: true,
      },
    });

    this.producer = kafka.producer({
      allowAutoTopicCreation: false,
      createPartitioner: Partitioners.DefaultPartitioner,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    this.logger.debug('Kafka producer connected to Aiven');
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
            periodStart: payload.periodStart.toISOString(),
            periodEnd: payload.periodEnd.toISOString(),
            occurredAt: new Date().toISOString(),
          }),
        },
      ],
    });

    this.logger.debug(
      `📨 Kafka [${KafkaMessageBrokerAdapter.TOPIC_SUBSCRIPTION_PURCHASED}]: published for payload=${JSON.stringify(payload)}`,
    );
  }
}
