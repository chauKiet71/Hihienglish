import { Controller, Get, Param, Post } from '@nestjs/common';
import { FeaturedVideoService } from './featured-video.service';

@Controller('featured-videos')
export class FeaturedVideoController {
  constructor(private readonly featuredVideos: FeaturedVideoService) {}

  @Get(':id/transcript')
  getTranscript(@Param('id') id: string) {
    return this.featuredVideos.getTranscript(id);
  }

  @Post(':id/transcript')
  prepareTranscript(@Param('id') id: string) {
    return this.featuredVideos.prepareTranscript(id);
  }
}
