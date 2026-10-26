import { FeaturedVideoService } from './featured-video.service';
import { PodcastAccessService, type PodcastViewer } from '../podcast/podcast-access.service';
export declare class FeaturedVideoController {
    private readonly featuredVideos;
    private readonly access;
    constructor(featuredVideos: FeaturedVideoService, access: PodcastAccessService);
    getTranscript(id: string, user: PodcastViewer | null): Promise<{
        segments: import("./video-translate.service").VideoSegment[];
        access: import("../podcast/podcast-access.service").PodcastPlaybackAccess;
        status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
        errorMessage: string | null;
    }>;
    prepareTranscript(id: string, user: PodcastViewer | null): Promise<{
        segments: import("./video-translate.service").VideoSegment[];
        access: import("../podcast/podcast-access.service").PodcastPlaybackAccess;
        status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
        errorMessage: string | null;
    } | {
        status: string;
        segments: never[];
        errorMessage: null;
        access: import("../podcast/podcast-access.service").PodcastPlaybackAccess;
    }>;
    private forViewer;
}
