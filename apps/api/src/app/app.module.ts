import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { databaseConfig } from './config/database.config';
import { appConfig } from './config/app.config';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { GqlGlobalExceptionFilter } from '../common/filters/graphql-exception.filter';
import { AuthModule } from '../modules/auth/auth.module';
import { BusinessModule } from '../modules/business/business.module';
import { TabModule } from '../modules/tab/tab.module';
import { WidgetModule } from '../modules/widget/widget.module';
import { DatasheetModule } from '../modules/datasheet/datasheet.module';
import { NotificationModule } from '../modules/notification/notification.module';
import { AuditModule } from '../modules/audit/audit.module';
import { DepartmentModule } from '../modules/department/department.module';
import { MailModule } from '../modules/mail/mail.module';
import { UserModule } from '../modules/user/user.module';
import { AdminModule } from '../modules/admin/admin.module';

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
        // Supabase pooler requires SSL with self-signed cert — accept in all envs
        ssl: { rejectUnauthorized: false },
        extra: { ssl: { rejectUnauthorized: false } },
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

    // Feature modules
    MailModule,
    AuthModule,
    UserModule,
    BusinessModule,
    DepartmentModule,
    TabModule,
    WidgetModule,
    DatasheetModule,
    NotificationModule,
    AuditModule,
    AdminModule,
  ],
  providers: [
    // Order matters: GraphQL filter handles GraphQL contexts, re-throws for REST.
    // REST filter then catches and converts to standard JSON error response.
    // Without REST filter, re-thrown exceptions become unhandled rejections → process crash.
    { provide: APP_FILTER, useClass: GqlGlobalExceptionFilter },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
