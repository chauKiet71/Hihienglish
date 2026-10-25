import { ConfigService } from '@nestjs/config';
export interface IflytekWordScore {
    content: string;
    score: number | null;
    beginPosition: number | null;
    endPosition: number | null;
}
export interface IflytekPronunciationResult {
    provider: 'iflytek';
    sid: string | null;
    category: 'read_sentence' | 'read_chapter';
    pronunciation: number | null;
    accuracy: number | null;
    fluency: number | null;
    completeness: number | null;
    standard: number | null;
    tone: number | null;
    emotion: number | null;
    total: number | null;
    words: IflytekWordScore[];
    raw: {
        provider: 'iflytek';
        sid: string | null;
        category: 'read_sentence' | 'read_chapter';
        scores: {
            pronunciation: number | null;
            accuracy: number | null;
            fluency: number | null;
            completeness: number | null;
            standard: number | null;
            tone: number | null;
            emotion: number | null;
            total: number | null;
        };
        words: IflytekWordScore[];
        xmlBytes: number;
        xmlSha256: string;
    };
}
interface ParsedIflytekXml {
    pronunciation: number | null;
    accuracy: number | null;
    fluency: number | null;
    completeness: number | null;
    standard: number | null;
    tone: number | null;
    emotion: number | null;
    total: number | null;
    words: IflytekWordScore[];
}
export declare function parseIflytekPronunciationXml(xml: string): ParsedIflytekXml;
export declare function buildIflytekAuthUrl(input: {
    endpoint: string;
    apiKey: string;
    apiSecret: string;
    now?: Date;
}): string;
export declare class IflytekPronunciationService {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    isConfigured(): boolean;
    assess(input: {
        audio: Buffer;
        referenceText: string;
    }): Promise<IflytekPronunciationResult | null>;
    private getRequiredConfig;
    private convertToPcm;
    private evaluatePcm;
    private sendAudioFrames;
    private readPositiveInteger;
    private readFrameBytes;
}
export {};
