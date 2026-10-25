export interface PublicVideo {
    id: string;
    title: string;
    duration: number;
    channelName: string;
    lessonPath: string;
}
export declare const PUBLIC_VIDEOS: PublicVideo[];
export declare const findPublicVideo: (id: string) => PublicVideo | undefined;
