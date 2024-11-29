import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Columns } from 'src/models/columns.entity';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(Columns)
    private columnsRepository: Repository<Columns>,
  ) {}

  // all the business logic here
  create(ColumnsData: Partial<Columns>): Promise<Columns> {
    const Columns = this.columnsRepository.create(ColumnsData);
    return this.columnsRepository.save(Columns);
  }

  findAll(): Promise<Columns[]> {
    return this.columnsRepository.find();
  }

  findOne(id: number): Promise<Columns> {
    return this.columnsRepository.findOne({ where: { id } });
  }
}
