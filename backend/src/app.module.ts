import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { ProjectsService } from './projects/projects.service';
import { ProjectsController } from './projects/projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Projects } from './models/projects.entity';
import { User } from './models/user.entity';
import { Media } from './models/media.entity';
import { Columns } from './models/columns.entity';
import { MediaService } from './media/media.service';
import { MediaController } from './media/media.controller';
import { ColumnsService } from './columns/columns.service';
import { ColumnsController } from './columns/columns.controller';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ProtectedController } from './protected/protected.controller';
import { FfmpegService } from './ffmpeg/ffmpeg.service';
import { FfmpegController } from './ffmpeg/ffmpeg.controller';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { CloudinaryController } from './cloudinary/cloudinary.controller';

@Module({
  controllers: [
    AppController,
    ProjectsController,
    MediaController,
    ColumnsController,
    ProtectedController,
    FfmpegController,
    CloudinaryController,
  ],
  providers: [
    AppService,
    ProjectsService,
    MediaService,
    ColumnsService,
    JwtService, // since we are using it in user.service file we have to add it in the root provider as well
    FfmpegService,
    CloudinaryService,
  ],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // config module from nestjs helps load and config env globally
    DatabaseModule,
    UserModule,
    TypeOrmModule.forFeature([Projects, User, Media, Columns]),
  ],
})
export class AppModule {}
