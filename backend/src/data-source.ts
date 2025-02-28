import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import path from 'path';

ConfigModule.forRoot(); // typeorm doesn't use config module so manually loading .env

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: parseInt(process.env.PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [path.join(__dirname, './models/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, './migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});
