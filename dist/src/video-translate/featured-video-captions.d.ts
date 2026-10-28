export declare function parseFeaturedCaptions(input: unknown, durationSec: number): {
    start: number;
    end: number;
    en: string;
}[];
export declare function selectFeaturedCaptionTrack(tracks: Array<Array<{
    start: number;
    end: number;
    en: string;
}>>): {
    start: number;
    end: number;
    en: string;
}[];
