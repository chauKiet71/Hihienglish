export interface PodcastVideo {
    id: string;
    title: string;
    duration: number;
}
export interface PodcastChannel {
    id: string;
    handle: string;
    name: string;
    channelId: string;
    url: string;
    description: string;
    avatarUrl: string;
    videos: PodcastVideo[];
}
export declare const PODCAST_CHANNELS: PodcastChannel[];
