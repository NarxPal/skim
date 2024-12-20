import { Test, TestingModule } from '@nestjs/testing';
import { FfmpegController } from './ffmpeg.controller';

describe('FfmpegController', () => {
  let controller: FfmpegController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FfmpegController],
    }).compile();

    controller = module.get<FfmpegController>(FfmpegController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
