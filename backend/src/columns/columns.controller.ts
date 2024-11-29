import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { Columns } from 'src/models/columns.entity';

@Controller('columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  // this get req is for the root (/projects)

  @Get() // http req
  async findAll(): Promise<Columns[]> {
    return this.columnsService.findAll();
  }

  @Post()
  async create(@Body() ColumnsData: Partial<Columns>): Promise<Columns> {
    return this.columnsService.create(ColumnsData);
  }

  // this get req is for fetching projects with id param (/projects/id)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Columns> {
    return this.columnsService.findOne(id);
  }
}
