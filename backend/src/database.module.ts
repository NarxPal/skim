import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './models/user.entity';
import { Projects } from './models/projects.entity';
import { Media } from './models/media.entity';
import { Columns } from './models/columns.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User, Projects, Media, Columns],
        synchronize: true, // Auto sync entities with the database, should be false in production, since it could lead to data loss, use migration instead

        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false, // allow self-signed certs
          },
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
