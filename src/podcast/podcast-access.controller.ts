import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { UpdatePodcastAccessDto } from './dto/update-podcast-access.dto';
import {
  PodcastAccessService,
  type PodcastViewer,
} from './podcast-access.service';

@Controller('podcasts')
export class PodcastAccessController {
  constructor(private readonly access: PodcastAccessService) {}

  @Get('access')
  @Header('Cache-Control', 'no-store')
  getAccessMap() {
    return this.access.getAccessMap();
  }

  @Get(':videoId/access')
  @UseGuards(OptionalJwtAuthGuard)
  @Header('Cache-Control', 'private, no-store')
  getPlaybackAccess(
    @Param('videoId') videoId: string,
    @CurrentUser() user: PodcastViewer | null,
  ) {
    return this.access.getPlaybackAccess(videoId, user);
  }

  @Put(':videoId/access')
  @UseGuards(JwtAuthGuard, AdminGuard)
  setAccess(
    @Param('videoId') videoId: string,
    @Body() dto: UpdatePodcastAccessDto,
  ) {
    return this.access.setAccess(videoId, dto.isPremium, dto.previewSeconds);
  }
}
