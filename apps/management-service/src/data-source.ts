// apps/management-service/src/data-source.ts
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- ESM way to get __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // This will be .../apps/management-service/src

// Load .env from the parent directory (apps/management-service/.env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Entities and Migrations paths for CLI (ts-node will run this from src)
// and for runtime (compiled JS will also be in a src-like structure within dist)
const entitiesPath = [path.join(__dirname, 'entities', '*.entity.{ts,js}')];
const migrationsPath = [path.join(__dirname, 'migrations', '*.{ts,js}')];

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres', // TypeORM will infer from process.env.DB_TYPE if available
  host: process.env.DB_HOST_CLI || process.env.DB_HOST || 'localhost', // Use specific CLI host or fallback
  port: parseInt(process.env.DB_PORT_CLI || process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME_CLI || process.env.DB_USERNAME || 'devuser',
  password: process.env.DB_PASSWORD_CLI || process.env.DB_PASSWORD || 'devsecret',
  database: process.env.DB_DATABASE_CLI || process.env.DB_DATABASE || 'url_shortener_app_db',
  
  // For generating migrations, synchronize MUST be false.
  // For running the app locally in dev, you might want it true initially IF NOT using migrations yet.
  // Once migrations are primary, this should always be false or controlled by a separate var.
  synchronize: process.env.DB_SYNCHRONIZE === 'true' && process.env.NODE_ENV === 'development', 
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
  
  entities: entitiesPath,
  migrations: migrationsPath,
  migrationsTableName: "typeorm_migrations", // Explicitly name the migrations table
  subscribers: [],
};

export const AppDataSource = new DataSource(dataSourceOptions);