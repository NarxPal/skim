import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FfmpegService } from './ffmpeg.service';
import * as multer from 'multer';

@Controller('ffmpeg')
export class FfmpegController {
  constructor(private readonly ffmpegService: FfmpegService) {}

  // post req for fetching first frame of the file
  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: multer.diskStorage({}) }))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    const imageBuffer = await this.ffmpegService.extractFirstFrame(file.path);
    return imageBuffer;
  }
}
