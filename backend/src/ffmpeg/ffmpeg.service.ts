import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import { Response } from 'express';

@Injectable()
export class FfmpegService {
  async extractFirstFrame(videoPath: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const buffers: Buffer[] = [];

      ffmpeg(videoPath)
        .outputOptions('-vframes', '1') // Extract one frame
        .outputFormat('image2') // output the img data as stream, instead of saving it as a file
        .outputOptions('-f', 'image2pipe')
        .outputOptions('-vcodec', 'mjpeg')
        .on('error', (err) => reject(err))
        .on('end', () => {
          const imageBuffer = Buffer.concat(buffers); // Combine data chunks
          resolve(imageBuffer); // Return the image buffer(buffer mean combined small data chunks)
        })
        .pipe()
        .on('data', (chunk) => buffers.push(chunk)); // Push chunks of image data
    });
  }

  async getMediaDuration(filePath: string): Promise<number> {
    const response = await axios.get(filePath, { responseType: 'stream' });
    console.log('file path checko', filePath);
    return new Promise((resolve, reject) => {
      let command = ffmpeg().input(response.data);

      command.ffprobe((err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format.duration);
        }
      });
    });
  }
}
