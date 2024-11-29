import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BarsService } from './bars.service';
import { Bars } from 'src/models/bars.entity';

@Controller('bars')
export class BarsController {
  constructor(private readonly barsService: BarsService) {}

  // this get req is for the root (/Bars)

  @Get() // http req
  async findAll(): Promise<Bars[]> {
    return this.barsService.findAll();
  }

  @Post()
  async create(@Body() projectData: Partial<Bars>): Promise<Bars> {
    return this.barsService.create(projectData);
  }

  // this get req is for fetching Bars with id param (/Bars/id)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Bars> {
    return this.barsService.findOne(id);
  }
}
