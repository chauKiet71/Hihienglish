import { PrismaService } from '../prisma/prisma.service';
export interface PodcastPolicy {
    videoId: string;
    isPremium: boolean;
    previewSeconds: number;
}
export interface PodcastViewer {
    role?: string;
    isPremium?: boolean;
    premiumExpiresAt?: Date | string | null;
}
export interface PodcastPlaybackAccess extends PodcastPolicy {
    canListenFull: boolean;
    previewLimitSeconds: number | null;
    premiumExpiresAt: string | null;
}
export declare class PodcastAccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAccessMap(): Promise<Record<string, PodcastPolicy>>;
    getPlaybackAccess(videoId: string, viewer?: PodcastViewer | null): Promise<PodcastPlaybackAccess>;
    setAccess(videoId: string, isPremium: boolean, previewSeconds: number): Promise<PodcastPolicy>;
    private findVideo;
}
