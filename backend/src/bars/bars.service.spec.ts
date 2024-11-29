import { Test, TestingModule } from '@nestjs/testing';
import { BarsService } from './bars.service';

describe('BarsService', () => {
  let service: BarsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BarsService],
    }).compile();

    service = module.get<BarsService>(BarsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
