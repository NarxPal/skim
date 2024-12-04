import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Projects } from '../models/projects.entity';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) {}

  // this get req is for the root (/projects)

  @Get() // http req
  async findAll(): Promise<Projects[]> {
    return this.projectService.findAll();
  }

  @Post()
  async create(@Body() projectData: Partial<Projects>): Promise<Projects> {
    return this.projectService.create(projectData);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() projectData: Partial<Projects>,
  ): Promise<Projects> {
    // projectData is only given filename , since we are using patch in here
    return this.projectService.update(id, projectData);
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: number): Promise<{ message: string }> {
    const deleted = await this.projectService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Project with ID ${id} not found.`);
    }
    return { message: `Project with ID ${id} successfully deleted.` };
  }

  // this get req is for fetching projects with id param (/projects/id)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Projects> {
    return this.projectService.findOne(id);
  }
}
