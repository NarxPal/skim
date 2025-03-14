import {
  Controller,
  UseInterceptors,
  Post,
  UploadedFile,
  Param,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { UploadApiResponse } from 'cloudinary';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('file/:userId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string,
  ) {
    return this.cloudinaryService.uploadFile(file, userId);
  }

  @Post('thumbnail')
  @UseInterceptors(FileInterceptor('file'))
  async uploadThumbnail(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    try {
      const result = await this.cloudinaryService.uploadThumbnail(file, userId);
      return { url: result.url };
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw error;
    }
  }
}
