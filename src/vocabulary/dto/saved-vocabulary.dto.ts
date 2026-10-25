import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class VocabularySourceDto {
  @IsIn(['lesson', 'featured-video', 'video'])
  type!: 'lesson' | 'featured-video' | 'video';

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  id!: string;

  @IsNumber()
  @Min(0)
  @Max(86400)
  startTime!: number;

  @IsNumber()
  @Min(0)
  @Max(86400)
  endTime!: number;
}

export class SaveVocabularyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  requestedWord!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  word!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  meaning!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  phonetic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  partOfSpeech?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  definition?: string;

  @ValidateNested()
  @Type(() => VocabularySourceDto)
  source!: VocabularySourceDto;
}

export class SavedVocabularyQueryDto {
  @IsOptional()
  @IsIn(['all', 'due', 'mastered'])
  status?: 'all' | 'due' | 'mastered';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  source?: string;

  @IsOptional()
  @IsIn(['newest', 'alphabetical'])
  sort?: 'newest' | 'alphabetical';

  @IsOptional()
  @IsUUID()
  wordId?: string;
}

export class ReviewSavedVocabularyDto {
  @IsBoolean()
  correct!: boolean;

  @IsUUID()
  requestId!: string;

  @IsInt()
  @Min(0)
  expectedReviewCount!: number;
}
