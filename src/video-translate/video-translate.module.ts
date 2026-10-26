import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VideoTranslateController } from './video-translate.controller';
import { VideoTranslateService } from './video-translate.service';
import { FeaturedVideoController } from './featured-video.controller';
import { FeaturedVideoService } from './featured-video.service';
import { PodcastModule } from '../podcast/podcast.module';

@Module({
  imports: [AuthModule, PodcastModule],
  controllers: [VideoTranslateController, FeaturedVideoController],
  providers: [VideoTranslateService, FeaturedVideoService],
  exports: [FeaturedVideoService],
})
export class VideoTranslateModule {}
