import { FeaturedVideoService } from './featured-video.service';
export declare class FeaturedVideoController {
    private readonly featuredVideos;
    constructor(featuredVideos: FeaturedVideoService);
    getTranscript(id: string): import("./featured-video.service").FeaturedVideoTranscript;
    prepareTranscript(id: string): import("./featured-video.service").FeaturedVideoTranscript;
}
