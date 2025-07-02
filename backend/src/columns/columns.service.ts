import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Columns } from 'src/models/columns.entity';
import { CreateColumnDto } from './dto/createDTO';
import { OnlySubColDto, BarData, Gap, Sub_Column } from './dto/createDTO';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(Columns)
    private columnsRepository: Repository<Columns>,
  ) {}

  findAll(): Promise<Columns[]> {
    return this.columnsRepository.find();
  }

  async findOneByProjectId(project_id: number): Promise<Columns> {
    const columns = await this.columnsRepository.findOne({
      where: { project_id },
    });
    return columns;
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

  async dropBarRow(rowId: number): Promise<BarData[] | []> {
    const columns = await this.columnsRepository.find();
    for (const column of columns) {
      for (const subCol of column.sub_columns || []) {
        if (subCol.sub_col_id === Number(rowId)) {
          return subCol.bars || [];
        }
      }
    }

    return [];
  }

  async fetchMediaClipForVolume(id: number): Promise<BarData> {
    const columns = await this.columnsRepository.find();

    for (const column of columns) {
      for (const subCol of column.sub_columns || []) {
        const bar = subCol.bars.find((b) => b.id === id);
        if (bar) return bar;
      }
    }

    throw new NotFoundException(`Clip with id ${id} not found`);
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
      media_type: subColumnData.media_type,
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
      sub_col_id: number;
      width: number;
      start_time: number;
      end_time: number;
      clip_duration: number;
      ruler_start_time: number;
      ruler_start_time_in_sec: number;
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
              bar.sub_col_id = updateBarData.sub_col_id;
              bar.width = updateBarData.width;
              bar.start_time = updateBarData.start_time;
              bar.end_time = updateBarData.end_time;
              bar.clip_duration = updateBarData.clip_duration;
              bar.ruler_start_time = updateBarData.ruler_start_time;
              bar.ruler_start_time_in_sec =
                updateBarData.ruler_start_time_in_sec;

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

  async updateClipVolume(id: number, updatedClipData: BarData) {
    const columns = await this.columnsRepository.find();
    if (!columns || columns.length === 0) {
      throw new NotFoundException(`No columns found`);
    }

    const matchingProjectColumns = columns.filter(
      (col) => col.project_id === updatedClipData.project_id,
    );

    if (matchingProjectColumns.length === 0) {
      throw new NotFoundException(`No columns found for project`);
    }

    for (const column of matchingProjectColumns) {
      const subCol = column.sub_columns.find(
        (sub) => sub.sub_col_id === updatedClipData.sub_col_id,
      );

      if (subCol) {
        const bar = subCol.bars.find((b) => b.id === updatedClipData.id);

        if (bar) {
          bar.volume = updatedClipData.volume;
          await this.columnsRepository.save(column);
          return bar;
        }
      }
    }

    throw new NotFoundException(`Clip with id ${id} not found`);
  }

  async updateGap(prjId: number, id: number, updateGapData: Gap) {
    const columns = await this.columnsRepository.find();
    const column = columns.find((col) => col.project_id === prjId);

    if (!column) {
      throw new NotFoundException(`Column with project_id ${prjId} not found`);
    }

    let gapFound = false;
    column.sub_columns?.forEach((subColumn) => {
      subColumn.gaps?.forEach((gap) => {
        if (gap.id === id) {
          gap.width = updateGapData.width;
          gap.start_gap = updateGapData.start_gap;
          gap.end_gap = updateGapData.end_gap;
          gap.sub_col_id = updateGapData.sub_col_id;
          gapFound = true;
        }
      });
    });

    if (!gapFound) {
      throw new NotFoundException(`Gap with id ${id} not found`);
    }

    await this.columnsRepository.save(column);
    return column;
  }

  async updateGapAfterDrop(prjId: number, updateGapData: any) {
    const columns = await this.columnsRepository.find();
    const column = columns.find((col) => col.project_id === prjId);
    if (!column) {
      throw new NotFoundException(`Column with project_id ${prjId} not found`);
    }

    let gapFound = false;

    const updatedGaps = updateGapData.updatedGaps;
    updatedGaps.forEach((newGap: Gap) => {
      column.sub_columns?.forEach((subColumn) => {
        if (subColumn.sub_col_id === newGap.sub_col_id) {
          subColumn.gaps?.forEach((gap) => {
            if (gap.id === newGap.id) {
              gap.width = newGap.width;
              gap.start_gap = newGap.start_gap;
              gap.end_gap = newGap.end_gap;
              gapFound = true;
            }
          });
        }
      });
    });

    if (!gapFound) {
      throw new NotFoundException(`Gap not found`);
    }

    await this.columnsRepository.save(column);
    return column;
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
            };
            const bars = subColumn?.bars || [];

            const isDuplicate = bars.some((bar) => bar.id === barWithOrder.id);
            if (isDuplicate) return; // skip insertion

            let insertIndex = bars.findIndex(
              (bar) => bar.left_position > barWithOrder.left_position,
            );
            // findIndex return -1 if no match found in array
            if (insertIndex === -1) insertIndex = bars.length;

            bars.splice(insertIndex, 0, barWithOrder);
            bars.forEach((bar, index) => {
              bar.order = index;
            });
          }
        });
      }
    });

    await this.columnsRepository.save(columns);
    return columns;
  }

  async addGapToSubCol(id: number, addGapData: any) {
    const columns = await this.columnsRepository.find();

    columns.forEach((column) => {
      if (column.sub_columns) {
        column.sub_columns.forEach((subColumn) => {
          if (subColumn.sub_col_id == id) {
            if (!subColumn.gaps) {
              subColumn.gaps = [];
            }

            const GapWithOrder = {
              ...addGapData.addGapData,
            };
            const gaps = subColumn?.gaps || [];

            const isDuplicate = gaps.some((gap) => gap.id === GapWithOrder.id);
            if (isDuplicate) return; // skip insertion

            let insertIndex = gaps.findIndex(
              (gap) => gap.start_gap > GapWithOrder.start_gap,
            );
            // findIndex return -1 if no match found in array
            if (insertIndex === -1) insertIndex = gaps.length;

            gaps.splice(insertIndex, 0, GapWithOrder);
          }
        });
      }
    });

    await this.columnsRepository.save(columns);
    return columns;
  }

  async updateBarToSubCol(id: number, barData: any) {
    try {
      const columns = await this.columnsRepository.find();
      for (const column of columns) {
        for (const subColumn of column.sub_columns || []) {
          if (subColumn.sub_col_id === id) {
            const barDataArr = Object.values(barData.addBarData) as BarData[];
            subColumn.bars = [...barDataArr]; // replace with new bars

            await this.columnsRepository.save(columns);
            return column;
          }
        }
      }
    } catch (error) {
      console.error('Error updating sub-column bars:', error);
      throw error;
    }
  }

  async addBarToNewSubCol(id: number, barData: BarData) {
    const columns = await this.columnsRepository.find();
    const column = columns.find((col) => col.project_id === barData.project_id);
    if (!column) {
      throw new NotFoundException(
        `Column with project_id ${barData.project_id} not found`,
      );
    }

    const subCol = column.sub_columns.find(
      (sc) => sc.sub_col_id === barData.sub_col_id,
    );
    if (!subCol) throw new NotFoundException(`Sub-column not found`);

    subCol.media_type = barData.type;
    subCol.bars.push({ ...barData, id });

    await this.columnsRepository.save(column);

    return column;
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

  async updateBarAZ(prjId: number, data: Sub_Column[]) {
    const column = await this.columnsRepository.findOne({
      where: { project_id: prjId },
    });
    if (!column) {
      throw new Error('Column not found');
    }

    // Update sub_columns with the new data
    column.sub_columns = data;
    await this.columnsRepository.save(column);
    return column;
  }

  async updateBarAfterSplit(prjId: number, splitBarData: any) {
    const columns = await this.columnsRepository.find();
    const column = columns.find((col) => col.project_id === prjId);
    if (!column) {
      throw new NotFoundException(`Column with project_id ${prjId} not found`);
    }

    for (const clip of splitBarData.combinedClips) {
      const subColId = clip.sub_col_id;
      const subCol = column.sub_columns?.find(
        (sc) => sc.sub_col_id === subColId,
      );
      if (!subCol) continue;

      if (!subCol.bars) subCol.bars = [];

      const isDuplicate = subCol.bars.some((bar) => bar.id === clip.id);
      if (isDuplicate) continue;

      subCol.bars.push(clip);
    }

    column.sub_columns?.forEach((subCol) => {
      if (!subCol.bars) return;
      subCol.bars = subCol.bars.filter(
        (bar) => !splitBarData.clipIdsToDelete.includes(bar.id),
      );
      subCol.bars.sort((a, b) => a.left_position - b.left_position);
      subCol.bars.forEach((bar, idx) => {
        bar.order = idx;
      });
    });

    await this.columnsRepository.save(column);
    return column;
  }

  async updateGapAfterSplit(prjId: number, splitGapData: any) {
    const columns = await this.columnsRepository.find();
    const column = columns.find((col) => col.project_id === prjId);
    if (!column) {
      throw new NotFoundException(`Column with project_id ${prjId} not found`);
    }

    const { combinedGaps, clipIdsToDelete } = splitGapData;

    for (const subCol of column.sub_columns || []) {
      if (!subCol.gaps) subCol.gaps = [];

      // Remove gaps whose barId is in clipIdsToDelete
      subCol.gaps = subCol.gaps.filter(
        (gap: Gap) => !clipIdsToDelete.includes(gap.barId),
      );

      const newGaps = combinedGaps.filter(
        (gap: Gap) =>
          gap.sub_col_id === subCol.sub_col_id &&
          !subCol.gaps.some((existing) => existing.barId === gap.barId),
      );

      subCol.gaps.push(...newGaps);
    }

    await this.columnsRepository.save(column);
    return column;
  }

  async delCmBar(cmSubColId: number, cmBarId: string) {
    const columns = await this.columnsRepository.find();
    columns.forEach((column) => {
      if (column.sub_columns) {
        column.sub_columns.forEach((subColumn) => {
          if (subColumn.sub_col_id === Number(cmSubColId)) {
            subColumn.bars = subColumn.bars?.filter(
              (bar) => Number(bar.id) !== Number(cmBarId),
            );

            if (subColumn.bars && subColumn.bars.length === 0) {
              subColumn.bars = [];
            }
            // If no bars are left, set `bars` to empty arr
          }
        });
      }
    });
    await this.columnsRepository.save(columns);
    return columns;
  }

  async delCmGap(cmSubColId: number, cmGapId: string) {
    const columns = await this.columnsRepository.find();
    columns.forEach((column) => {
      if (column.sub_columns) {
        column.sub_columns.forEach((subColumn) => {
          if (subColumn.sub_col_id === Number(cmSubColId)) {
            subColumn.gaps = subColumn.gaps?.filter(
              (gap) => Number(gap.id) !== Number(cmGapId),
            );

            if (subColumn.gaps && subColumn.gaps.length === 0) {
              subColumn.gaps = [];
            }
            // If no gaps are left, set `gaps` to empty arr
          }
        });
      }
    });
    await this.columnsRepository.save(columns);
    return columns;
  }

  async delSubCol(prjId: string): Promise<Columns[]> {
    const columns = await this.columnsRepository.find();

    const filteredColumns = columns
      .filter((column) => column.project_id === Number(prjId))
      .map((column) => {
        if (column.sub_columns) {
          column.sub_columns = column.sub_columns.filter(
            (subColumn) => subColumn.bars && subColumn.bars.length > 0,
          );
        }
        return column;
      });

    await this.columnsRepository.save(filteredColumns);
    return filteredColumns;
  }
}
