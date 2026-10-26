import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { ImportMode } from '../catalog.types';
export class AddPodcastChannelDto {
  @IsString() @MaxLength(500) url: string;
}
export class PodcastVisibilityDto {
  @IsBoolean() isVisible: boolean;
}
export class CreatePodcastImportDto {
  @IsIn(['OLDER', 'NEWER', 'URL']) mode: ImportMode;
  @IsInt() @Min(1) @Max(100) count: number;
  @IsOptional() @IsString() @MaxLength(500) videoUrl?: string;
}
export class CommitPodcastImportDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(11, { each: true })
  videoIds: string[];
}
