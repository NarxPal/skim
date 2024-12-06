import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { BarsService } from './bars.service';
import { Bars } from 'src/models/bars.entity';

@Controller('bars')
export class BarsController {
  constructor(private readonly barsService: BarsService) {}

  // this get req is for the root (/Bars)

  @Get() // http req
  async findAll(): Promise<Bars[]> {
    return this.barsService.findAll();
  }

  @Post()
  async create(@Body() barData: Partial<Bars>): Promise<Bars> {
    return this.barsService.create(barData);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateBarData: { left_position: number; width: number },
  ): Promise<Bars> {
    return this.barsService.update(id, updateBarData);
  }

  // this get req is for fetching Bars with id param (/bars/id)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Bars> {
    return this.barsService.findOne(Number(id));
  }
}
