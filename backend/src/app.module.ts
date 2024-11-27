import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { ProjectsService } from './projects/projects.service';
import { ProjectsController } from './projects/projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Projects } from './models/projects.entity';
import { User } from './models/user.entity';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';

@Module({
  controllers: [AppController, ProjectsController, UserController],
  providers: [AppService, ProjectsService, UserService],
  imports: [DatabaseModule, TypeOrmModule.forFeature([Projects, User])],
})
export class AppModule {}
