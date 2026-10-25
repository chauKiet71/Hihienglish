import { VideoTranslateService, type VideoSegment } from './video-translate.service';
export interface FeaturedVideoTranscript {
    status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
    segments: VideoSegment[];
    errorMessage: string | null;
}
export declare class FeaturedVideoService {
    private readonly videoTranslate;
    private readonly logger;
    private readonly lessons;
    constructor(videoTranslate: VideoTranslateService);
    getTranscript(id: string): FeaturedVideoTranscript;
    prepareTranscript(id: string): FeaturedVideoTranscript;
    private findVideo;
    private cachePath;
}
