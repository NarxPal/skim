import { Test, TestingModule } from '@nestjs/testing';
import { BarsController } from './bars.controller';

describe('BarsController', () => {
  let controller: BarsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BarsController],
    }).compile();

    controller = module.get<BarsController>(BarsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
