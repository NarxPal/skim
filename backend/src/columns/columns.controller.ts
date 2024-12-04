import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { Columns } from 'src/models/columns.entity';
import { CreateColumnDto } from './dto/createDTO';
import { SubColDto } from './dto/createDTO';
@Controller('columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  // this get req is for the root (/projects)

  @Get() // http req
  async findAll(): Promise<Columns[]> {
    return this.columnsService.findAll();
  }

  // here project_id would refer to project_id in columns entity
  @Get(':project_id')
  async findOneByProjectId(
    @Param('project_id') project_id: number,
  ): Promise<Columns> {
    return this.columnsService.findOneByProjectId(project_id);
  }

  @Post(':rootColumnId/sub-columns')
  async addSubColToRoot(
    @Param('rootColumnId') rootColumnId: number,
    @Body() subColumnData: SubColDto,
  ) {
    return this.columnsService.addSubColumnToRoot(rootColumnId, subColumnData);
  }

  @Patch('sub-columns/bars/:id')
  async updateBar(
    @Param('id') id: number,
    @Body() updateBarData: { left_position: number; width: number },
  ) {
    return this.columnsService.updateBar(Number(id), updateBarData);
  }

  @Post()
  createColumn(@Body() createColumnDto: CreateColumnDto) {
    return this.columnsService.create(createColumnDto);
  }

  @Delete('/:projectId')
  async deleteRootCol(
    @Param('projectId') project_id: number,
  ): Promise<{ message: string }> {
    const deleted = await this.columnsService.delete(project_id);
    if (!deleted) {
      throw new NotFoundException(
        `root column with ID ${project_id} not found.`,
      );
    }
    return {
      message: `root column with ID ${project_id} successfully deleted.`,
    };
  }
}
