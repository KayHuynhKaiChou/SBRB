import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BullModule } from '@nestjs/bull';
import { join } from 'path';
import { databaseConfig } from './config/database.config';
import { appConfig } from './config/app.config';
import { AuthModule } from '../modules/auth/auth.module';
import { BusinessModule } from '../modules/business/business.module';
import { TabModule } from '../modules/tab/tab.module';
import { WidgetModule } from '../modules/widget/widget.module';
import { DatasheetModule } from '../modules/datasheet/datasheet.module';
import { NotificationModule } from '../modules/notification/notification.module';
import { AuditModule } from '../modules/audit/audit.module';

@Module({
  imports: [
    // Config — load .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, databaseConfig],
    }),

    // TypeORM — Supabase PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: config.get('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
        entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
        migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
        synchronize: config.get('NODE_ENV') === 'development', // NEVER in production
        logging: config.get('DB_LOGGING', false),
      }),
    }),

    // GraphQL — Apollo code-first
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'apps/api/src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': false,
      },
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    }),

    // BullMQ — Redis job queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD'),
          tls: config.get('REDIS_TLS', 'false') === 'true' ? {} : undefined,
        },
      }),
    }),

    // Feature modules
    AuthModule,
    BusinessModule,
    TabModule,
    WidgetModule,
    DatasheetModule,
    NotificationModule,
    AuditModule,
  ],
})
export class AppModule {}
