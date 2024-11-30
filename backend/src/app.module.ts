import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { ProjectsService } from './projects/projects.service';
import { ProjectsController } from './projects/projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Projects } from './models/projects.entity';
import { User } from './models/user.entity';
import { MediaService } from './media/media.service';
import { MediaController } from './media/media.controller';
import { ColumnsService } from './columns/columns.service';
import { ColumnsController } from './columns/columns.controller';
import { BarsService } from './bars/bars.service';
import { BarsController } from './bars/bars.controller';
import { Media } from './models/media.entity';
import { Columns } from './models/columns.entity';
import { Bars } from './models/bars.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ProtectedController } from './protected/protected.controller';

@Module({
  controllers: [
    AppController,
    ProjectsController,
    MediaController,
    ColumnsController,
    BarsController,
    ProtectedController,
  ],
  providers: [
    AppService,
    ProjectsService,
    MediaService,
    ColumnsService,
    BarsService,
    JwtService, // since we are using it in user.service file we have to add it in the root provider as well
  ],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UserModule,
    TypeOrmModule.forFeature([Projects, User, Media, Columns, Bars]),
  ],
})
export class AppModule {}
