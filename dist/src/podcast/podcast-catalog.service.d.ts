import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeCatalogService } from './youtube-catalog.service';
import type { CatalogChannel } from './catalog.types';
import { PublicCatalogCacheService } from '../public-cache/public-catalog-cache.service';
export declare class PodcastCatalogService implements OnModuleInit {
    private readonly prisma;
    private readonly youtube;
    private readonly cache?;
    constructor(prisma: PrismaService, youtube: YoutubeCatalogService, cache?: PublicCatalogCacheService | undefined);
    onModuleInit(): Promise<void>;
    list(admin?: boolean): Promise<CatalogChannel[]>;
    private publicVideo;
    findVideo(id: string, admin?: boolean): Promise<{
        id: string;
        title: string;
        duration: number;
        isVisible: boolean;
        transcriptStatus: string;
        publishedAt: string | null;
        channelName: string;
        channelId: string;
        lessonPath: string;
    }>;
    addChannel(url: string): Promise<{
        url: string;
        id: string;
        avatarUrl: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        sortOrder: number;
        isVisible: boolean;
        youtubeChannelId: string;
        handle: string;
        uploadsPlaylistId: string | null;
        lastSyncedAt: Date | null;
    }>;
    setChannelVisible(id: string, isVisible: boolean): Promise<{
        url: string;
        id: string;
        avatarUrl: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        sortOrder: number;
        isVisible: boolean;
        youtubeChannelId: string;
        handle: string;
        uploadsPlaylistId: string | null;
        lastSyncedAt: Date | null;
    }>;
    setVideoVisible(id: string, isVisible: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        duration: number;
        sortOrder: number;
        isVisible: boolean;
        title: string;
        channelId: string;
        publishedAt: Date | null;
        transcriptStatus: string;
    }>;
    setTranscriptStatus(id: string, status: string): Promise<void>;
}
