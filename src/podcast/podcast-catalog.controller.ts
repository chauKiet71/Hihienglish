import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  UseGuards,
  Optional,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PodcastCatalogService } from './podcast-catalog.service';
import { PodcastImportService } from './podcast-import.service';
import { YoutubeCatalogService } from './youtube-catalog.service';
import {
  AddPodcastChannelDto,
  CommitPodcastImportDto,
  CreatePodcastImportDto,
  PodcastVisibilityDto,
} from './dto/catalog.dto';
import { PublicCatalogCacheService } from '../public-cache/public-catalog-cache.service';
import {
  PublicCatalogKeys,
  PODCAST_CATALOG_TTL_MS,
} from '../public-cache/public-catalog.keys';

@Controller('podcasts')
export class PodcastCatalogController {
  constructor(
    private readonly catalog: PodcastCatalogService,
    @Optional() private readonly cache?: PublicCatalogCacheService,
  ) {
    cache?.register(PublicCatalogKeys.podcasts, PODCAST_CATALOG_TTL_MS, () =>
      catalog.list(),
    );
  }
  @Get('catalog') @Header('Cache-Control', 'no-store') list() {
    return (
      this.cache?.getOrLoad(
        PublicCatalogKeys.podcasts,
        PODCAST_CATALOG_TTL_MS,
        () => this.catalog.list(),
      ) ?? this.catalog.list()
    );
  }
}

@Controller('admin/podcasts')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPodcastCatalogController {
  constructor(
    private readonly catalog: PodcastCatalogService,
    private readonly imports: PodcastImportService,
    private readonly youtube: YoutubeCatalogService,
  ) {}
  @Get('catalog') @Header('Cache-Control', 'private, no-store') async list() {
    return {
      channels: await this.catalog.list(true),
      youtubeConfigured: this.youtube.configured,
    };
  }
  @Post('channels') add(@Body() dto: AddPodcastChannelDto) {
    return this.catalog.addChannel(dto.url);
  }
  @Patch('channels/:id') channelVisibility(
    @Param('id') id: string,
    @Body() dto: PodcastVisibilityDto,
  ) {
    return this.catalog.setChannelVisible(id, dto.isVisible);
  }
  @Patch('videos/:id') videoVisibility(
    @Param('id') id: string,
    @Body() dto: PodcastVisibilityDto,
  ) {
    return this.catalog.setVideoVisible(id, dto.isVisible);
  }
  @Get('channels/:id/imports')
  @Header('Cache-Control', 'private, no-store')
  jobs(@Param('id') id: string) {
    return this.imports.list(id);
  }
  @Post('channels/:id/imports') start(
    @Param('id') id: string,
    @Body() dto: CreatePodcastImportDto,
  ) {
    return this.imports.create(id, dto.mode, dto.count, dto.videoUrl);
  }
  @Get('imports/:id') @Header('Cache-Control', 'private, no-store') job(
    @Param('id') id: string,
  ) {
    return this.imports.get(id);
  }
  @Post('imports/:id/commit') commit(
    @Param('id') id: string,
    @Body() dto: CommitPodcastImportDto,
  ) {
    return this.imports.commit(id, dto.videoIds);
  }
}
