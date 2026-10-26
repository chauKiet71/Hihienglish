import { ConfigService } from '@nestjs/config';
import type { ImportCandidate } from './catalog.types';
export declare function youtubeDuration(value: string): number;
export declare function channelFilter(input: string): Record<string, string>;
export declare class YoutubeCatalogService {
    private readonly config;
    constructor(config: ConfigService);
    get configured(): boolean;
    private request;
    channel(input: string): Promise<{
        youtubeChannelId: string;
        handle: string;
        name: string;
        description: string;
        url: string;
        avatarUrl: string;
        uploadsPlaylistId: string;
    }>;
    videos(ids: string[]): Promise<ImportCandidate[]>;
    page(playlistId: string, pageToken?: string): Promise<{
        ids: string[];
        nextPageToken: string | undefined;
    }>;
    video(url: string): Promise<ImportCandidate>;
}
