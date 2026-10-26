import { IsBoolean, IsInt, Max, Min } from 'class-validator';

export class UpdatePodcastAccessDto {
  @IsBoolean()
  isPremium: boolean;

  @IsInt()
  @Min(0)
  @Max(86399)
  previewSeconds: number;
}
