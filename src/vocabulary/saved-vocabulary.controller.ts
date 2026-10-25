import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ReviewSavedVocabularyDto,
  SaveVocabularyDto,
  SavedVocabularyQueryDto,
} from './dto/saved-vocabulary.dto';
import { SavedVocabularyService } from './saved-vocabulary.service';

@Controller('vocabulary/saved')
@UseGuards(JwtAuthGuard)
export class SavedVocabularyController {
  constructor(private readonly service: SavedVocabularyService) {}

  @Get()
  list(
    @CurrentUser() user: { id: string },
    @Query() query: SavedVocabularyQueryDto,
  ) {
    return this.service.list(user.id, query);
  }

  @Get('session')
  session(
    @CurrentUser() user: { id: string },
    @Query() query: SavedVocabularyQueryDto,
  ) {
    return this.service.session(user.id, query);
  }

  @Post()
  save(@CurrentUser() user: { id: string }, @Body() dto: SaveVocabularyDto) {
    return this.service.save(user.id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(user.id, id);
  }

  @Post(':id/review')
  review(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewSavedVocabularyDto,
  ) {
    return this.service.review(user.id, id, dto);
  }

  @Get(':id/sources/:sourceId/replay')
  replay(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sourceId', ParseUUIDPipe) sourceId: string,
  ) {
    return this.service.replay(user.id, id, sourceId);
  }
}
