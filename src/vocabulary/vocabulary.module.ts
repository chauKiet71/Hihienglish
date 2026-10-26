import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import { VideoTranslateModule } from '../video-translate/video-translate.module';
import { SavedVocabularyController } from './saved-vocabulary.controller';
import { SavedVocabularyService } from './saved-vocabulary.service';
import { PodcastModule } from '../podcast/podcast.module';

@Module({
  imports: [AuthModule, VideoTranslateModule, PodcastModule],
  controllers: [VocabularyController, SavedVocabularyController],
  providers: [VocabularyService, SavedVocabularyService],
})
export class VocabularyModule {}
