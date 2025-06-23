import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { User } from './entities/user.entity.js';
import { Url } from './entities/url.entity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.resolve(__dirname, '../.env') }); 

const entitiesPath = [path.join(__dirname, 'entities', '*.entity.{ts,js}')];
const migrationsPath = [path.join(__dirname, 'migrations', '*.{ts,js}')];


let connectionOptions: DataSourceOptions;

if (process.env.DATABASE_URL) {
  console.log("DATA_SOURCE.TS: Using DATABASE_URL for connection:", process.env.DATABASE_URL);
  connectionOptions = {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: process.env.DB_SYNCHRONIZE === 'true' && process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
    entities: entitiesPath,
    migrations: migrationsPath,
    migrationsTableName: "typeorm_migrations",
    subscribers: [],
  };
} else {
  console.log("DATA_SOURCE.TS: DATABASE_URL not found, falling back to individual DB params for CLI.");
  connectionOptions = {
    type: 'postgres',
    host: process.env.DB_HOST_CLI || 'localhost',
    port: parseInt(process.env.DB_PORT_CLI || '5432', 10),
    username: process.env.DB_USERNAME_CLI || 'devuser',
    password: process.env.DB_PASSWORD_CLI || 'devsecret',
    database: process.env.DB_DATABASE_CLI || 'url_shortener_app_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true' && process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
    entities: entitiesPath,
    migrations: migrationsPath,
    migrationsTableName: "typeorm_migrations",
    subscribers: [],
  };
}

export const dataSourceOptions = connectionOptions;
export const AppDataSource = new DataSource(dataSourceOptions);