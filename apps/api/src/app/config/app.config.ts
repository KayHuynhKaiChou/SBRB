import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  // MinIO (S3-compatible)
  minioEndpoint: process.env.MINIO_ENDPOINT || 'localhost',
  minioPort: parseInt(process.env.MINIO_PORT || '9000', 10),
  minioAccessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  minioSecretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  minioBucket: process.env.MINIO_BUCKET || 'sbrb',
  minioPublicUrl: process.env.MINIO_PUBLIC_URL || 'http://localhost:9000',
  // Email (Gmail SMTP via nodemailer)
  mailHost: process.env.MAIL_HOST || 'smtp.gmail.com',
  mailPort: parseInt(process.env.MAIL_PORT || '587', 10),
  mailUsername: process.env.MAIL_USERNAME,
  mailPassword: process.env.MAIL_PASSWORD,
  mailFrom: process.env.MAIL_FROM || 'noreply@sbrb.app',
  // Rate limiting
  rateLimitPublic: parseInt(process.env.RATE_LIMIT_PUBLIC || '100', 10),
  rateLimitAuth: parseInt(process.env.RATE_LIMIT_AUTH || '500', 10),
}));
