import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './entities/user.entity.js';  
import { Url } from './entities/url.entity.js';   

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL, // Should point to url_shortener_db on postgres_main
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  entities: [User, Url], 
  migrations: [],
  subscribers: [],
};

export const AppDataSource = new DataSource(dataSourceOptions);