import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './models/user.entity';
import { Projects } from './models/projects.entity';
import { Media } from './models/media.entity';
import { Columns } from './models/columns.entity';
import { Bars } from './models/bars.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: 'localhost',
        port: parseInt(configService.get<string>('DB_PORT'), 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        // entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Adjust as per your structure
        entities: [User, Projects, Media, Columns, Bars],
        synchronize: true, // Auto sync entities with the database
      }),
    }),
  ],
})
export class DatabaseModule {}
