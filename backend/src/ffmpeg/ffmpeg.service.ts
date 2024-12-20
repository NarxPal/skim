import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class FfmpegService {
  async extractFirstFrame(videoPath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];

      ffmpeg(videoPath)
        .outputOptions('-vframes', '1') // Extract one frame
        .outputFormat('image2pipe') // output the img data as stream, instead of saving it as a file
        .on('error', (err) => reject(err))
        .on('end', () => {
          const imageBuffer = Buffer.concat(buffers); // Combine data chunks
          resolve(imageBuffer); // Return the image buffer(buffer mean combined small data chunks)
        })
        .pipe()
        .on('data', (chunk) => buffers.push(chunk)); // Push chunks of image data
    });
  }
}
