import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bars } from 'src/models/bars.entity';

@Injectable()
export class BarsService {
  constructor(
    @InjectRepository(Bars)
    private barsRepository: Repository<Bars>,
  ) {}

  // all the business logic here
  create(projectData: Partial<Bars>): Promise<Bars> {
    const bars = this.barsRepository.create(projectData);
    return this.barsRepository.save(bars);
  }

  findAll(): Promise<Bars[]> {
    return this.barsRepository.find();
  }

  findOne(id: number): Promise<Bars> {
    return this.barsRepository.findOne({ where: { id } });
  }
}
