import { initTracing } from './tracing';
initTracing();

import { SWAGGER_AUTH_KEY, SWAGGER_DOCS_PATH } from '@20206205tech/nestjs-auth';
import { DomainExceptionFilter } from '@20206205tech/nestjs-common';
import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const ENVIRONMENT = process.env.ENVIRONMENT ?? 'production';
  const SERVICE_NAME = 'code-payment-service';
  const PORT = process.env.PORT ?? 33001;

  const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
  const PAYMENT_DEFAULT_PROVIDER = process.env.PAYMENT_DEFAULT_PROVIDER;

  let DESCRIPTION = '';
  DESCRIPTION += `# Chào mừng đến với ${SERVICE_NAME} (${ENVIRONMENT})\n\n`;

  // DESCRIPTION += `* **PAYMENT_DEFAULT_PROVIDER = ${PAYMENT_DEFAULT_PROVIDER}**\n\n`;
  DESCRIPTION += `* **PAYMENT_DEFAULT_PROVIDER = ${PAYMENT_DEFAULT_PROVIDER}**\n\n`;

  DESCRIPTION += `* [Đăng nhập Google](https://${SUPABASE_PROJECT_ID}.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://20206205tech.github.io/auth-callback)\n`;
  DESCRIPTION += `* [Database](https://console.neon.tech/app/org-still-feather-82034197/projects?q=${SERVICE_NAME})\n`;
  DESCRIPTION += `* [Local](http://localhost:${PORT}/${SERVICE_NAME})\n`;
  DESCRIPTION += `* [Dev](https://dev-${SERVICE_NAME}.20206205.tech/${SERVICE_NAME})\n`;

  DESCRIPTION = DESCRIPTION.trim();
  Logger.debug(`DESCRIPTION: \n${DESCRIPTION}`);

  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: SERVICE_NAME,
    }),
  });

  app.setGlobalPrefix(`${SERVICE_NAME}`);
  app.useGlobalFilters(new DomainExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các trường không được định nghĩa trong DTO
      transform: true, // Tự động convert kiểu dữ liệu (vd: string sang number)
    }),
  );

  const configSwagger = new DocumentBuilder()
    .setTitle(`${SERVICE_NAME} (${ENVIRONMENT})`)
    .setDescription(DESCRIPTION)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      SWAGGER_AUTH_KEY,
    )
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, configSwagger);

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  SwaggerModule.setup(
    `${SERVICE_NAME}/${SWAGGER_DOCS_PATH}`,
    app,
    documentFactory,
    customOptions,
  );

  await app.listen(PORT);
}

bootstrap().catch((err) => {
  console.error('Lỗi khi khởi động ứng dụng:', err);
});
