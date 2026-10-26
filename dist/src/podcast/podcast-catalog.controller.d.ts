import { PodcastCatalogService } from './podcast-catalog.service';
import { PodcastImportService } from './podcast-import.service';
import { YoutubeCatalogService } from './youtube-catalog.service';
import { AddPodcastChannelDto, CommitPodcastImportDto, CreatePodcastImportDto, PodcastVisibilityDto } from './dto/catalog.dto';
export declare class PodcastCatalogController {
    private readonly catalog;
    constructor(catalog: PodcastCatalogService);
    list(): Promise<import("./catalog.types").CatalogChannel[]>;
}
export declare class AdminPodcastCatalogController {
    private readonly catalog;
    private readonly imports;
    private readonly youtube;
    constructor(catalog: PodcastCatalogService, imports: PodcastImportService, youtube: YoutubeCatalogService);
    list(): Promise<{
        channels: import("./catalog.types").CatalogChannel[];
        youtubeConfigured: boolean;
    }>;
    add(dto: AddPodcastChannelDto): Promise<{
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
    channelVisibility(id: string, dto: PodcastVisibilityDto): Promise<{
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
    videoVisibility(id: string, dto: PodcastVisibilityDto): Promise<{
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
    jobs(id: string): Promise<import("./catalog.types").CatalogImportJob[]>;
    start(id: string, dto: CreatePodcastImportDto): Promise<import("./catalog.types").CatalogImportJob>;
    job(id: string): Promise<import("./catalog.types").CatalogImportJob>;
    commit(id: string, dto: CommitPodcastImportDto): Promise<import("./catalog.types").CatalogImportJob>;
}
