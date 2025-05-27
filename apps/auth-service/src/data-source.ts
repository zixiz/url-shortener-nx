// apps/auth-service/src/data-source.ts
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './entities/user.entity.js'; 
// import { SnakeNamingStrategy } from 'typeorm-naming-strategies'; // Optional: for snake_case columns

dotenv.config(); 


export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // host: process.env.DB_HOST, // Alternatively, use individual parameters
  // port: parseInt(process.env.DB_PORT || '5432'),
  // username: process.env.DB_USERNAME,
  // password: process.env.DB_PASSWORD,
  // database: process.env.DB_NAME,
  synchronize: process.env.NODE_ENV === 'development', // true only in dev - creates schema from entities. NEVER use in prod.
  logging: process.env.NODE_ENV === 'development' ? 'all' : ['error'], // Log all queries in dev, only errors in prod.
  entities: [User], // Or [__dirname + '/entities/**/*{.ts,.js}'] if you have many entities
  // entities: [isCompiled ? 'dist/apps/auth-service/src/entities/**/*.js' : 'apps/auth-service/src/entities/**/*.ts'],
  // migrations: [isCompiled ? 'dist/apps/auth-service/src/migrations/**/*.js' : 'apps/auth-service/src/migrations/**/*.ts'],
  migrations: [], // We'll add migrations later if needed
  subscribers: [],
  // namingStrategy: new SnakeNamingStrategy(), // Optional: if you prefer snake_case in DB
};

export const AppDataSource = new DataSource(dataSourceOptions);