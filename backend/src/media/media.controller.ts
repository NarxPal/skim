import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MediaService } from './media.service';
import { Media } from 'src/models/media.entity';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':user_id') // http req
  async findByUserId(@Param('user_id') user_id: string): Promise<Media[]> {
    return this.mediaService.findByUserId(user_id);
  }

  @Post()
  async create(@Body() projectData: Partial<Media>): Promise<Media> {
    return this.mediaService.create(projectData);
  }

  // this get req is for fetching projects with id param (/projects/id)
  @Get('/file/:id')
  async findOne(@Param('id') id: number): Promise<Media> {
    return this.mediaService.findOne(id);
  }
}
