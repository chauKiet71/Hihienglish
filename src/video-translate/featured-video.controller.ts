import {
  Controller,
  Get,
  Header,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FeaturedVideoService } from './featured-video.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  PodcastAccessService,
  type PodcastViewer,
} from '../podcast/podcast-access.service';

@Controller('featured-videos')
@UseGuards(OptionalJwtAuthGuard)
export class FeaturedVideoController {
  constructor(
    private readonly featuredVideos: FeaturedVideoService,
    private readonly access: PodcastAccessService,
  ) {}

  @Get(':id/transcript')
  @Header('Cache-Control', 'private, no-store')
  async getTranscript(
    @Param('id') id: string,
    @CurrentUser() user: PodcastViewer | null,
  ) {
    const access = await this.access.getPlaybackAccess(id, user);
    const result = this.featuredVideos.getTranscript(id);
    return this.forViewer(result, access);
  }

  @Post(':id/transcript')
  @Header('Cache-Control', 'private, no-store')
  async prepareTranscript(
    @Param('id') id: string,
    @CurrentUser() user: PodcastViewer | null,
  ) {
    const access = await this.access.getPlaybackAccess(id, user);
    if (access.previewLimitSeconds === 0)
      return { status: 'READY', segments: [], errorMessage: null, access };
    return this.forViewer(this.featuredVideos.prepareTranscript(id), access);
  }

  private forViewer(
    result: ReturnType<FeaturedVideoService['getTranscript']>,
    access: Awaited<ReturnType<PodcastAccessService['getPlaybackAccess']>>,
  ) {
    return {
      ...result,
      segments:
        access.previewLimitSeconds === null
          ? result.segments
          : result.segments.filter(
              (segment) => segment.end <= access.previewLimitSeconds!,
            ),
      access,
    };
  }
}
