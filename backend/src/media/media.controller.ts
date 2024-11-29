import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MediaService } from './media.service';
import { Media } from 'src/models/media.entity';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get() // http req
  async findAll(): Promise<Media[]> {
    return this.mediaService.findAll();
  }

  @Post()
  async create(@Body() projectData: Partial<Media>): Promise<Media> {
    return this.mediaService.create(projectData);
  }

  // this get req is for fetching projects with id param (/projects/id)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Media> {
    return this.mediaService.findOne(id);
  }
}
