import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeCatalogService } from './youtube-catalog.service';
import type { CatalogImportJob, ImportMode } from './catalog.types';
export declare class PodcastImportService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly youtube;
    private readonly logger;
    private timer?;
    private running;
    private stopped;
    constructor(prisma: PrismaService, youtube: YoutubeCatalogService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private publicJob;
    list(channelId: string): Promise<CatalogImportJob[]>;
    get(id: string): Promise<CatalogImportJob>;
    create(channelId: string, mode: ImportMode, requestedCount: number, videoUrl?: string): Promise<CatalogImportJob>;
    commit(id: string, ids: string[]): Promise<CatalogImportJob>;
    private drain;
    private scan;
}
