import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load .env for CLI migrations (outside NestJS context)
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const isProduction = process.env.NODE_ENV === 'production';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
};

/** Used by TypeORM CLI: npx typeorm migration:run -d src/app/config/typeorm-data-source.config.ts */
const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
