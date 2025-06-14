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
import { CreateColumnDto, Sub_Column } from './dto/createDTO';
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

  // @Get('sub-columns/:dragOverSubColId')
  // async subColIdBars(
  //   @Param('dragOverSubColId') dragOverSubColId: number,
  // ): Promise<OnlySubColDto> {
  //   console.log('this function is not used anywhere', dragOverSubColId);
  //   return this.columnsService.subColIdBars(Number(dragOverSubColId));
  // }

  // get bars from droppped row
  @Get('sub-columns/row/:rowId')
  async dropBarRow(@Param('rowId') rowId: string): Promise<BarData[]> {
    console.log('row id ', rowId);
    return this.columnsService.dropBarRow(Number(rowId));
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
    @Body() subColumnData: OnlySubColDto,
  ) {
    return this.columnsService.addSubColumnToRoot(rootColumnId, subColumnData);
  }

  @Post()
  createColumn(@Body() createColumnDto: CreateColumnDto) {
    return this.columnsService.create(createColumnDto);
  }

  // updatebar after resize
  @Patch('sub-columns/bars/:id')
  async updateBar(
    @Param('id') id: number,
    @Body()
    updateBarData: {
      left_position: number;
      sub_col_id: number;
      width: number;
      start_time: number;
      end_time: number;
      clip_duration: number;
      ruler_start_time: number;
      ruler_start_time_in_sec: number;
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
    return this.columnsService.updateGap(Number(id), updateGapData);
  }

  // used in updateBarRow function in frontend
  @Patch('sub-columns/:id')
  async addBarToSubCol(@Param('id') id: number, @Body() addBarData: any) {
    return this.columnsService.addBarToSubCol(Number(id), addBarData);
  }

  @Patch('sub-columns/updateBar/:id')
  async updateBarToSubCol(@Param('id') id: number, @Body() barData: any) {
    console.log('updatebar RAN');
    return this.columnsService.updateBarToSubCol(Number(id), barData);
  }

  // for updating lp of bars present after dropped bar
  @Patch('sub-columns/updateBarLP/:dropSubColId')
  async updateBarLp(
    @Param('dropSubColId') dropSubColId: number,
    @Body() lpBars: any,
  ) {
    return this.columnsService.updateBarLp(Number(dropSubColId), lpBars);
  }

  // update subcolumn after zoom changes
  @Patch('subCol/:prjId')
  async updateBarAZ(@Param('prjId') prjId: string, @Body() data: Sub_Column[]) {
    return this.columnsService.updateBarAZ(Number(prjId), data);
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

  @Delete('/sub-columns/:cmSubColId/bars/:cmBarId')
  async delCmBar(
    @Param('cmSubColId') cmSubColId: number,
    @Param('cmBarId') cmBarId: string,
  ) {
    return this.columnsService.delCmBar(cmSubColId, cmBarId);
  }

  // for deleting the subcol, (similar path have been used in addBarToSubCol)
  @Delete('/sub-columns/:cmSubColId')
  async delSubCol(@Param('cmSubColId') cmSubColId: number) {
    return this.columnsService.delSubCol(cmSubColId);
  }
}
