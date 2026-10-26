export interface CatalogVideo {
    id: string;
    title: string;
    duration: number;
    publishedAt?: string | null;
    isVisible: boolean;
    transcriptStatus: string;
    channelName: string;
    channelId: string;
    lessonPath: string;
}
export interface CatalogChannel {
    id: string;
    channelId: string;
    handle: string;
    name: string;
    url: string;
    description: string;
    avatarUrl: string;
    isVisible: boolean;
    lastSyncedAt: string | null;
    videos: CatalogVideo[];
}
export interface ImportCandidate {
    id: string;
    title: string;
    duration: number;
    publishedAt: string | null;
    youtubeChannelId: string;
}
export type ImportMode = 'OLDER' | 'NEWER' | 'URL';
export interface CatalogImportJob {
    id: string;
    channelId: string;
    mode: ImportMode;
    requestedCount: number;
    videoUrl?: string | null;
    status: string;
    scannedCount: number;
    importedCount: number;
    errorMessage: string | null;
    candidates: ImportCandidate[];
    createdAt: string;
}
