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
import {
  CreateColumnDto,
  Sub_Column,
  OnlySubColDto,
  BarData,
  Gap,
} from './dto/createDTO';
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

  // get bars from droppped row
  @Get('sub-columns/row/:rowId')
  async dropBarRow(@Param('rowId') rowId: string): Promise<BarData[]> {
    return this.columnsService.dropBarRow(Number(rowId));
  }

  @Get('sub-columns/clips/:id')
  async fetchMediaClipForVolume(@Param('id') id: string): Promise<BarData> {
    return this.columnsService.fetchMediaClipForVolume(Number(id));
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

  // it runs in createRootColumn in frontend
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

  @Patch('sub-columns/clips/:id')
  async updateClipVolume(
    @Param('id') id: number,
    @Body()
    updatedClipData: BarData,
  ) {
    return this.columnsService.updateClipVolume(Number(id), updatedClipData);
  }

  // updateGapAfterResize and updateGapLPAfterDrop, handleGap, handleDelGap
  @Patch('sub-columns/gaps/update/:prjId/:id')
  async updateGap(
    @Param('prjId') prjId: number,
    @Param('id') id: number,
    @Body()
    updateGapData: Gap,
  ) {
    return this.columnsService.updateGap(
      Number(prjId),
      Number(id),
      updateGapData,
    );
  }

  // used in shiftGapsAfterDrop and shiftGapsAfterGapDelete
  @Patch('sub-columns/g/update/batchUpdate/:prjId')
  async updateGapAfterDrop(
    @Param('prjId') prjId: number,
    @Body()
    updateGapData: Gap[],
  ) {
    return this.columnsService.updateGapAfterDrop(Number(prjId), updateGapData);
  }

  // used in updateBarRow function in frontend
  @Patch('sub-columns/:id')
  async addBarToSubCol(@Param('id') id: number, @Body() addBarData: any) {
    return this.columnsService.addBarToSubCol(Number(id), addBarData);
  }

  // for updateGapRow
  @Patch('sub-columns/gap/update/:id')
  async addGapToSubCol(@Param('id') id: number, @Body() addGapData: any) {
    return this.columnsService.addGapToSubCol(Number(id), addGapData);
  }

  @Patch('sub-columns/updateBar/:id')
  async updateBarToSubCol(@Param('id') id: number, @Body() barData: any) {
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

  @Patch('sub-columns/split/update/:prjId')
  async updateBarAfterSplit(
    @Param('prjId') prjId: number,
    @Body() splitBarData: any,
  ) {
    return this.columnsService.updateBarAfterSplit(Number(prjId), splitBarData);
  }

  @Patch('sub-columns/splitGaps/update/:prjId')
  async updateGapAfterSplit(
    @Param('prjId') prjId: number,
    @Body() splitGapData: any,
  ) {
    return this.columnsService.updateGapAfterSplit(Number(prjId), splitGapData);
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

  @Delete('/sub-columns/gaps/:cmSubColId/:cmGapId')
  async delCmGap(
    @Param('cmSubColId') cmSubColId: number,
    @Param('cmGapId') cmGapId: string,
  ) {
    return this.columnsService.delCmGap(cmSubColId, cmGapId);
  }

  // for deleting the subcol,
  @Delete('/sub-columns/delSubCol/:prjId')
  async delSubCol(@Param('prjId') prjId: string) {
    return this.columnsService.delSubCol(prjId);
  }
}
