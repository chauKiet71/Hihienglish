import { PodcastCatalogService } from '../podcast/podcast-catalog.service';
import { VideoTranslateService, type VideoSegment } from './video-translate.service';
export interface FeaturedVideoTranscript {
    status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
    segments: VideoSegment[];
    errorMessage: string | null;
}
export declare class FeaturedVideoService {
    private readonly videoTranslate;
    private readonly catalog;
    private readonly logger;
    private readonly lessons;
    constructor(videoTranslate: VideoTranslateService, catalog: PodcastCatalogService);
    getTranscript(id: string): Promise<FeaturedVideoTranscript>;
    private readTranscript;
    prepareTranscript(id: string): Promise<FeaturedVideoTranscript>;
    private saveStatus;
    private cachePath;
}
