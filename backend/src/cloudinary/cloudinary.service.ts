import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(file: Express.Multer.File, userId: string) {
    const filePath = `media/${userId}/${file.mimetype.split('/')[0]}/${file.originalname}`;

    try {
      const uploadResult: UploadApiResponse = await new Promise(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                public_id: filePath,
                resource_type: 'auto',
                overwrite: false,
              },
              (error, result) => {
                if (error) reject(error);
                resolve(result);
              },
            )
            .end(file.buffer);
        },
      );

      return { url: uploadResult.secure_url };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  async uploadThumbnail(postData: Express.Multer.File, userId: string) {
    try {
      const thumbnailPath = `thumbnail/${userId}/${postData.mimetype.split('/')[0]}/${postData.originalname}`;

      console.log(
        'Buffer Content (Hex):',
        postData.buffer.toString('hex').slice(0, 20),
      );

      console.log('File MIME Type:', postData.mimetype);

      const resourceType = postData.mimetype.startsWith('image/')
        ? 'image'
        : postData.mimetype.startsWith('video/')
          ? 'video'
          : 'raw';

      const thumbResult: UploadApiResponse = await new Promise(
        (resolve, reject) => {

          const uploadStream = cloudinary.uploader.upload_stream(
            {
              public_id: thumbnailPath,
              resource_type: "image",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            },
          );
          // bufferStream.pipe(uploadStream);
          uploadStream.end(postData.buffer);
        },
      );
      return { url: thumbResult.secure_url };
    } catch (error) {
      console.error('Cloudinary thumbnail upload error:', error);
      throw error;
    }
  }
}
