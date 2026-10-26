import { UpdatePodcastAccessDto } from './dto/update-podcast-access.dto';
import { PodcastAccessService, type PodcastViewer } from './podcast-access.service';
export declare class PodcastAccessController {
    private readonly access;
    constructor(access: PodcastAccessService);
    getAccessMap(): Promise<Record<string, import("./podcast-access.service").PodcastPolicy>>;
    getPlaybackAccess(videoId: string, user: PodcastViewer | null): Promise<import("./podcast-access.service").PodcastPlaybackAccess>;
    setAccess(videoId: string, dto: UpdatePodcastAccessDto): Promise<import("./podcast-access.service").PodcastPolicy>;
}
