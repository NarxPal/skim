import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Res,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FfmpegService } from './ffmpeg.service';
import * as multer from 'multer';
import { Response } from 'express';

@Controller('ffmpeg')
export class FfmpegController {
  constructor(private readonly ffmpegService: FfmpegService) {}

  // post req for fetching first frame of the file
  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: multer.diskStorage({}) }))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      const imageBuffer = await this.ffmpegService.extractFirstFrame(file.path);
      res.set('Content-Type', 'image/jpeg'); // inform client to take binary data as image
      res.send(imageBuffer);
    } catch (err) {
      res
        .status(500)
        .json({ error: 'Error extracting frame', message: err.message });
    }
  }

  // using query here since public url contains "/" so cant use param
  @Get('duration')
  async getDuration(@Query('publicUrl') publicUrl: string): Promise<number> {
    const fileUrl = decodeURIComponent(publicUrl); // Decode URL
    const duration = await this.ffmpegService.getMediaDuration(fileUrl);
    return duration;
  }
}
