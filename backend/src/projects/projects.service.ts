import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Projects } from '../models/projects.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Projects)
    private projectRepository: Repository<Projects>,
  ) {}

  // all the business logic here
  create(projectData: Partial<Projects>): Promise<Projects> {
    const project = this.projectRepository.create(projectData);
    return this.projectRepository.save(project);
  }

  async update(id: number, projectData: Partial<Projects>): Promise<Projects> {
    const project = await this.projectRepository.findOneBy({ id });
    if (!project) throw new NotFoundException('Project not found');

    Object.assign(project, projectData);
    return this.projectRepository.save(project);
  }

  findAll(): Promise<Projects[]> {
    return this.projectRepository.find();
  }

  findOne(id: number): Promise<Projects> {
    return this.projectRepository.findOne({ where: { id } });
  }
}
