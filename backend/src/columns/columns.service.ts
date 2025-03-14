import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Columns } from 'src/models/columns.entity';
import { CreateColumnDto } from './dto/createDTO';
import {
  SubColDto,
  OnlySubColDto,
  BarData,
  Gap,
  Sub_Column,
} from './dto/createDTO';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(Columns)
    private columnsRepository: Repository<Columns>,
  ) {}

  findAll(): Promise<Columns[]> {
    return this.columnsRepository.find();
  }

  findOneByProjectId(project_id: number): Promise<Columns> {
    return this.columnsRepository.findOne({ where: { project_id } });
  }

  async subColIdBars(
    dragOverSubColId: number,
  ): Promise<OnlySubColDto | undefined> {
    const columns = await this.columnsRepository.find();
    for (const column of columns) {
      const subColumn = column.sub_columns?.find(
        (subCol) => subCol.id === dragOverSubColId,
      );
      if (subColumn) {
        return subColumn;
      }
    }
    return undefined;
  }

  async dragBarId(subColId: number, id: number): Promise<BarData | undefined> {
    const columns = await this.columnsRepository.find();
    let getBar: BarData;
    columns.forEach((column) => {
      if (column.sub_columns) {
        column.sub_columns.forEach((subColumn) => {
          if (subColumn.id === Number(subColId)) {
            getBar = subColumn.bars?.find((bar) => bar.id === Number(id));
          }
        });
      }
    });
    return getBar;
  }

  // Create a new column (root or sub-column)
  async create(createColumnDto: CreateColumnDto) {
    const column = this.columnsRepository.create(createColumnDto);
    return this.columnsRepository.save(column);
  }

  async delete(project_id: number): Promise<boolean> {
    const result = await this.columnsRepository.delete({ project_id });
    return result.affected > 0;
  }

  // Add sub-column to a root column
  async addSubColumnToRoot(rootColumnId: number, subColumnData: OnlySubColDto) {
    const rootColumn = await this.columnsRepository.findOne({
      where: { id: rootColumnId },
    });

    if (!rootColumn) {
      throw new Error(`Root column with ID ${rootColumnId} not found`);
    }

    const newSubColumn = {
      id: Math.floor(Math.random() * 1000),
      sub_col_id: subColumnData.sub_col_id,
      project_id: subColumnData.project_id,
      user_id: subColumnData.user_id,
      parent_id: rootColumnId,
      bars: subColumnData.bars,
      gaps: subColumnData.gaps,
    };

    // adding sub_columns to root column in here
    if (!rootColumn.sub_columns) rootColumn.sub_columns = [];
    rootColumn.sub_columns.push(newSubColumn);

    await this.columnsRepository.save(rootColumn);

    return newSubColumn;
  }

  async updateBar(
    id: number,
    updateBarData: {
      left_position: number;
      width: number;
      start_time: number;
      end_time: number;
    },
  ) {
    const columns = await this.columnsRepository.find();

    if (!columns || columns.length === 0) {
      throw new NotFoundException(`No columns found`);
    }

    let barFound = false;
    columns.forEach((column) => {
      if (column.sub_columns) {
        column.sub_columns.forEach((subColumn) => {
          subColumn.bars?.forEach((bar) => {
            if (bar.id === id) {
              bar.left_position = updateBarData.left_position;
              bar.width = updateBarData.width;
              bar.start_time = updateBarData.start_time;
              bar.end_time = updateBarData.end_time;
              barFound = true;
            }
          });
        });
      }
    });

    if (!barFound) {
      throw new NotFoundException(`Bar with id ${id} not found`);
    }

    return this.columnsRepository.save(columns);
  }

  async updateGap(id: number, updateGapData: Gap) {
    const columns = await this.columnsRepository.find();

    if (!columns || columns.length === 0) {
      throw new NotFoundException(`No columns found`);
    }

    let barFound = false;
    columns.forEach((column) => {
      if (column.sub_columns) {
        column.sub_columns.forEach((subColumn) => {
          subColumn.gaps?.forEach((gap) => {
            if (gap.barId === id) {
              gap.width = updateGapData.width;
              gap.start_gap = updateGapData.start_gap;
              gap.end_gap = updateGapData.end_gap;
              barFound = true;
            }
          });
        });
      }
    });

    if (!barFound) {
      throw new NotFoundException(`gap with id ${id} not found`);
    }

    return this.columnsRepository.save(columns);
  }

  async deleteDraggedBar(SubColId: number, BarId: number) {
    const columns = await this.columnsRepository.find();
    // not deleted from db
    columns.forEach((column) => {
      if (column.sub_columns) {
        column.sub_columns.forEach((subColumn) => {
          if (subColumn.id === Number(SubColId)) {
            subColumn.bars = subColumn.bars?.filter(
              (bar) => bar.id !== Number(BarId),
            );

            if (subColumn.bars && subColumn.bars.length === 0) {
              subColumn.bars = undefined;
            }
          }
        });
      }
    });

    await this.columnsRepository.save(columns);
  }

  // here id refers to sub_column id
  async addBarToSubCol(id: number, addBarData: any) {
    const columns = await this.columnsRepository.find();

    columns.forEach((column) => {
      if (column.sub_columns) {
        column.sub_columns.forEach((subColumn) => {
          if (subColumn.sub_col_id == id) {
            if (!subColumn.bars) {
              subColumn.bars = [];
            }

            const barWithOrder = {
              ...addBarData.addBarData,
              order: addBarData.barIndex,
            };

            subColumn?.bars?.splice(addBarData.barIndex, 0, barWithOrder);

            subColumn?.bars?.forEach((bar, index) => {
              bar.order = index;
            });
          }
        });
      }
    });

    await this.columnsRepository.save(columns);
  }

  async updateBarLp(id: number, lpBars: BarData[]) {
    const columns = await this.columnsRepository.find();
    let updatedBars: BarData[] = [];
    columns.forEach((column) => {
      if (column.sub_columns) {
        column.sub_columns.forEach((subColumn) => {
          if (subColumn.id == id) {
            if (subColumn.bars) {
              lpBars.forEach((updatedBar) => {
                // Find the bar in the sub-column that matches the updatedBar ID
                const bar = subColumn.bars.find((b) => b.id === updatedBar.id);
                if (bar) {
                  // Update the bar's left_position
                  bar.left_position = updatedBar.left_position;
                  updatedBars.push(bar);
                }
              });
            }
          }
        });
      }
    });

    await this.columnsRepository.save(columns);
    return updatedBars;
  }

  async delCmBar(cmSubColId: number, cmBarId: string): Promise<void> {
    const columns = await this.columnsRepository.find();
    columns.forEach((column) => {
      if (column.sub_columns) {
        column.sub_columns.forEach((subColumn) => {
          if (subColumn.sub_col_id === Number(cmSubColId)) {

            subColumn.bars = subColumn.bars?.filter(
              (bar) => Number(bar.id) !== Number(cmBarId),
            );
            
            // If no bars are left, set `bars` to undefined
            if (subColumn.bars && subColumn.bars.length === 0) {
              subColumn.bars = [];
            }
            // If no bars are left, set `bars` to empty arr
          }
        });
      }
    });
    await this.columnsRepository.save(columns);
  }

  async delSubCol(cmSubColId: number): Promise<void> {
    const columns = await this.columnsRepository.find();

    columns.forEach((column) => {
      if (column.sub_columns) {
        // Filter out the sub-column with the matching ID
        column.sub_columns = column.sub_columns.filter(
          (subColumn) => subColumn.id !== Number(cmSubColId),
        );
      }
    });

    await this.columnsRepository.save(columns);
  }
}
