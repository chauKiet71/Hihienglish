export declare const VOLKA_CHANNEL: {
    name: string;
    handle: string;
    url: string;
    avatarUrl: string;
};
export declare const VOLKA_VIDEOS: {
    id: string;
    title: string;
    duration: number;
    publishedAt: string;
}[];
export type VolkaVideo = (typeof VOLKA_VIDEOS)[number];
