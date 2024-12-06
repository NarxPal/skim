import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Columns } from 'src/models/columns.entity';
import { CreateColumnDto } from './dto/createDTO';
import { SubColDto } from './dto/createDTO';

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
  async addSubColumnToRoot(rootColumnId: number, subColumnData: SubColDto) {
    const rootColumn = await this.columnsRepository.findOne({
      where: { id: rootColumnId },
    });

    if (!rootColumn) {
      throw new Error(`Root column with ID ${rootColumnId} not found`);
    }

    const newSubColumn = {
      id: Math.floor(Math.random() * 1000),
      project_id: subColumnData.project_id,
      user_id: subColumnData.user_id,
      parent_id: rootColumnId,
      bars: subColumnData.bars,
    };

    // adding sub_columns to root column in here
    if (!rootColumn.sub_columns) rootColumn.sub_columns = [];
    rootColumn.sub_columns.push(newSubColumn);

    await this.columnsRepository.save(rootColumn);

    return newSubColumn;
  }

  async updateBar(
    id: number,
    updateBarData: { left_position: number; width: number },
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

  async deleteDraggedBar(SubColId: number, BarId: number) {
    const columns = await this.columnsRepository.find();
    // not deleted from db
    columns.forEach((column) => {
      if (column.sub_columns) {
        column.sub_columns.forEach((subColumn) => {
          if (subColumn.id === Number(SubColId)) {
            console.log('BRO SEE THIS:', subColumn.id, SubColId);
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
          if (subColumn.id == id) {
            subColumn.bars.push(addBarData.addBarData);
          }
        });
      }
    });

    await this.columnsRepository.save(columns);
  }
}
