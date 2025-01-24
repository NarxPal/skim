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
import { SubColDto, OnlySubColDto, BarData, Gap } from './dto/createDTO';
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

  @Get('sub-columns/:dragOverSubColId')
  async subColIdBars(
    @Param('dragOverSubColId') dragOverSubColId: number,
  ): Promise<OnlySubColDto> {
    return this.columnsService.subColIdBars(Number(dragOverSubColId));
  }

  // filter to get dragged bar id
  @Get(':subColId/bars/:id')
  async dragBarId(
    @Param('subColId') subColId: number,
    @Param('id') id: number,
  ): Promise<BarData> {
    return this.columnsService.dragBarId(subColId, Number(id));
  }

  @Post(':rootColumnId/sub-columns')
  async addSubColToRoot(
    @Param('rootColumnId') rootColumnId: number,
    @Body() subColumnData: SubColDto,
  ) {
    return this.columnsService.addSubColumnToRoot(rootColumnId, subColumnData);
  }

  // updatebar after resize
  @Patch('sub-columns/bars/:id')
  async updateBar(
    @Param('id') id: number,
    @Body()
    updateBarData: {
      left_position: number;
      width: number;
      start_time: number;
      end_time: number;
    },
  ) {
    return this.columnsService.updateBar(Number(id), updateBarData);
  }

  // update gap after resize
  @Patch('sub-columns/gaps/:id')
  async updateGap(
    @Param('id') id: number,
    @Body()
    updateGapData: Gap,
  ) {
    console.log('updategapdata', updateGapData);
    return this.columnsService.updateGap(Number(id), updateGapData);
  }

  @Patch('sub-columns/:SubColId/bars/:BarId')
  async delBarSubCol(
    @Param('SubColId') SubColId: number,
    @Param('BarId') BarId: number,
  ) {
    return this.columnsService.deleteDraggedBar(SubColId, BarId);
  }

  @Patch('sub-columns/:id')
  async addBarToSubCol(@Param('id') id: number, @Body() addBarData: any) {
    return this.columnsService.addBarToSubCol(Number(id), addBarData);
  }

  @Patch('sub-columns/updateBarLP/:dropSubColId')
  async updateBarLp(
    @Param('dropSubColId') dropSubColId: number,
    @Body() lpBars: any,
  ) {
    return this.columnsService.updateBarLp(Number(dropSubColId), lpBars);
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

  @Delete('/sub-columns/:cmSubColId/bars/:cmBarName')
  async delCmBar(
    @Param('cmSubColId') cmSubColId: number,
    @Param('cmBarName') cmBarName: string,
  ) {
    return this.columnsService.delCmBar(cmSubColId, cmBarName);
  }

  // for deleting the subcol, (similar path have been using in addBarToSubCol)
  @Delete('/sub-columns/:cmSubColId')
  async delSubCol(@Param('cmSubColId') cmSubColId: number) {
    return this.columnsService.delSubCol(cmSubColId);
  }
}
