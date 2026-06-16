import dns from 'dns';
import { KafkaContainer, StartedKafkaContainer } from '@testcontainers/kafka';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { VALID_TOKEN } from './constants/bearer-token.constant';

dns.setDefaultResultOrder('ipv4first');

jest.setTimeout(120000);

let postgresContainer: StartedPostgreSqlContainer;
let redisContainer: StartedRedisContainer;
let kafkaContainer: StartedKafkaContainer;

async function startPostgresContainer(): Promise<StartedPostgreSqlContainer> {
  const container = await new PostgreSqlContainer('postgres:15-alpine')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_pass')
    .withExposedPorts(5432)
    .withStartupTimeout(120000)
    .start();

  return container;
}

async function startRedisContainer(): Promise<StartedRedisContainer> {
  const container = await new RedisContainer('redis:7-alpine').start();
  return container;
}

async function startKafkaContainer(): Promise<StartedKafkaContainer> {
  return await new KafkaContainer('confluentinc/cp-kafka:7.3.3')
    .withExposedPorts(9093)
    .start();
}

function seedSecrets(): void {
  process.env.API_GATEWAY_HTTP_LOG_BEARER = VALID_TOKEN;

  // Logger module DB
  process.env.API_GATEWAY_HTTP_LOG_DATABASE_URL =
    postgresContainer.getConnectionUri();

  // Payment module DB
  process.env.MICROSERVICE_PAYMENT_SERVICE_DATABASE_URL =
    postgresContainer.getConnectionUri();

  // Supabase stub
  process.env.SUPABASE_PROJECT_ID = 'test-project-id';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';

  // Redis container
  process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

  // Kafka container
  const kafkaHost =
    kafkaContainer.getHost() === 'localhost'
      ? '127.0.0.1'
      : kafkaContainer.getHost();
  process.env.KAFKA_BROKER = `${kafkaHost}:${kafkaContainer.getMappedPort(9093)}`;

  // Payment Gateways (Dummy values)
  process.env.PAYMENT_VNPAY_TMN_CODE = 'TEST_TMN';
  process.env.PAYMENT_VNPAY_HASH_SECRET_KEY = 'TEST_SECRET';
  process.env.PAYMENT_VNPAY_PAYMENT_URL =
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

  process.env.PAYMENT_MOMO_PARTNER_CODE = 'TEST_MOMO';
  process.env.PAYMENT_MOMO_ACCESS_KEY = 'TEST_ACCESS';
  process.env.PAYMENT_MOMO_SECRET_KEY = 'TEST_SECRET';
  process.env.PAYMENT_MOMO_ENDPOINT =
    'https://test-payment.momo.vn/v2/gateway/api/create';

  process.env.PAYMENT_ZALOPAY_APP_ID = '123';
  process.env.PAYMENT_ZALOPAY_KEY1 = 'key1';
  process.env.PAYMENT_ZALOPAY_KEY2 = 'key2';
  process.env.PAYMENT_ZALOPAY_ENDPOINT =
    'https://sb-openapi.zalopay.vn/v2/create';

  process.env.PAYMENT_SEPAY_API_KEY = 'test-key';
  process.env.PAYMENT_SEPAY_API_URL = 'https://my.sepay.vn/api';
  process.env.PAYMENT_DEFAULT_PROVIDER = 'vnpay';

  // Email
  process.env.BREVO_API_KEY = 'test-brevo-key';
  // process.env.EMAIL_NAME = 'Test Sender';
  // process.env.EMAIL_ADDRESS = 'test@sender.com';
  // process.env.EMAIL_ADDRESS_DEV = 'dev@test.com';

  // Môi trường test
  process.env.ENVIRONMENT = 'test';
}

beforeAll(async () => {
  try {
    [postgresContainer, redisContainer, kafkaContainer] = await Promise.all([
      startPostgresContainer(),
      startRedisContainer(),
      startKafkaContainer(),
    ]);

    seedSecrets();
  } catch (error) {
    console.error('Failed to setup test environment:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    const globalAny = global as any;
    const app = globalAny.app;
    if (app) {
      await app.close();
      globalAny.app = null;
    }
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

    await Promise.all([
      postgresContainer?.stop().catch((err: any) => {
        console.warn(
          'Warning: Failed to stop PostgreSQL container:',
          err instanceof Error ? err.message : String(err),
        );
      }),
      redisContainer?.stop().catch((err: any) => {
        console.warn(
          'Warning: Failed to stop Redis container:',
          err instanceof Error ? err.message : String(err),
        );
      }),
      kafkaContainer?.stop().catch((err: any) => {
        console.warn(
          'Warning: Failed to stop Kafka container:',
          err instanceof Error ? err.message : String(err),
        );
      }),
    ]);
  } catch (error) {
    console.error('Failed to cleanup test environment:', error);
  }
});
