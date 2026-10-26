import type { ImportMode } from '../catalog.types';
export declare class AddPodcastChannelDto {
    url: string;
}
export declare class PodcastVisibilityDto {
    isVisible: boolean;
}
export declare class CreatePodcastImportDto {
    mode: ImportMode;
    count: number;
    videoUrl?: string;
}
export declare class CommitPodcastImportDto {
    videoIds: string[];
}
