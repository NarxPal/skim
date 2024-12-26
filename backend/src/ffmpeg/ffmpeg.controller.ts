import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FfmpegService } from './ffmpeg.service';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

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

  // what method req to send for audio video media duration fetching?
  @Get('duration/*')
  async getDuration(@Param() params: string): Promise<number> {
    const fileUrl = decodeURIComponent(params[0]); // Decode URL
    const duration = await this.ffmpegService.getMediaDuration(fileUrl);
    return duration;
  }
}
