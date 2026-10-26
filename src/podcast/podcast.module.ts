import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PodcastAccessController } from './podcast-access.controller';
import { PodcastAccessService } from './podcast-access.service';
import { PodcastCatalogService } from './podcast-catalog.service';
import { PodcastImportService } from './podcast-import.service';
import { YoutubeCatalogService } from './youtube-catalog.service';
import {
  AdminPodcastCatalogController,
  PodcastCatalogController,
} from './podcast-catalog.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    PodcastCatalogController,
    PodcastAccessController,
    AdminPodcastCatalogController,
  ],
  providers: [
    PodcastCatalogService,
    PodcastAccessService,
    PodcastImportService,
    YoutubeCatalogService,
  ],
  exports: [PodcastAccessService, PodcastCatalogService],
})
export class PodcastModule {}
