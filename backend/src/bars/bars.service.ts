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
  create(barData: Partial<Bars>): Promise<Bars> {
    const bars = this.barsRepository.create(barData);
    return this.barsRepository.save(bars);
  }

  findAll(): Promise<Bars[]> {
    return this.barsRepository.find();
  }

  findOne(id: number): Promise<Bars> {
    return this.barsRepository.findOne({ where: { id } });
  }

  async update(id: number, updateData: Partial<Bars>): Promise<Bars> {
    const bar = await this.barsRepository.findOne({ where: { id } });

    if (!bar) {
      throw new Error('Bar not found'); // You can throw a custom exception here
    }

    // Update the bar with the provided data
    Object.assign(bar, updateData);

    // Save the updated bar to the database
    return this.barsRepository.save(bar);
  }
}
