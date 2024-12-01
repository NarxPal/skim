import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from 'src/models/media.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  // all the business logic here
  create(mediaData: Partial<Media>): Promise<Media> {
    const media = this.mediaRepository.create(mediaData);
    return this.mediaRepository.save(media);
  }

  findByUserId(user_id: string): Promise<Media[]> {
    return this.mediaRepository.find({ where: { user_id } });
  }

  findOne(id: number): Promise<Media> {
    return this.mediaRepository.findOne({ where: { id } });
  }
}
