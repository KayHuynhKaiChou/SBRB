import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import helmet from 'helmet';
import * as Sentry from '@sentry/nestjs';
import { AppModule } from './app/app.module';

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  });

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true, // Required for HttpOnly cookie auth
    },
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cookieParser());

  // Global validation pipe (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // REST API prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['/graphql', '/health'],
  });

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`🚀 API running at http://localhost:${port}`);
  console.log(`🚀 GraphQL playground: http://localhost:${port}/graphql`);
}

bootstrap();
