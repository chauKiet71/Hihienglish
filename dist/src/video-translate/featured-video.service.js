"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FeaturedVideoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturedVideoService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const podcast_catalog_service_1 = require("../podcast/podcast-catalog.service");
const video_translate_service_1 = require("./video-translate.service");
let FeaturedVideoService = FeaturedVideoService_1 = class FeaturedVideoService {
    videoTranslate;
    catalog;
    logger = new common_1.Logger(FeaturedVideoService_1.name);
    lessons = new Map();
    constructor(videoTranslate, catalog) {
        this.videoTranslate = videoTranslate;
        this.catalog = catalog;
    }
    async getTranscript(id) {
        await this.catalog.findVideo(id);
        return this.readTranscript(id);
    }
    readTranscript(id) {
        const existing = this.lessons.get(id);
        if (existing)
            return existing;
        for (const path of [this.cachePath(id), this.cachePath(id, 2)]) {
            if (!(0, fs_1.existsSync)(path))
                continue;
            try {
                const segments = JSON.parse((0, fs_1.readFileSync)(path, 'utf8'));
                if (Array.isArray(segments) &&
                    segments.length &&
                    segments.every((segment, index) => Number.isFinite(segment.start) &&
                        Number.isFinite(segment.end) &&
                        segment.end > segment.start &&
                        segment.start >= (segments[index - 1]?.end ?? 0) - 0.001 &&
                        typeof segment.en === 'string' &&
                        typeof segment.vi === 'string' &&
                        segment.en.trim().length > 0 &&
                        segment.vi.trim().length > 0 &&
                        (!segment.words ||
                            segment.words.every((word) => Number.isFinite(word.start) &&
                                Number.isFinite(word.end) &&
                                word.end > word.start &&
                                word.start >= segment.start - 0.001 &&
                                word.end <= segment.end + 0.001)) &&
                        segment.en.split(/\s+/).filter(Boolean).length <=
                            video_translate_service_1.TRANSCRIPT_RULES.maxWords &&
                        (segment.end - segment.start <= video_translate_service_1.TRANSCRIPT_RULES.maxDurationSec ||
                            segment.en.split(/\s+/).filter(Boolean).length < 8))) {
                    const result = {
                        status: 'READY',
                        segments,
                        errorMessage: null,
                    };
                    this.lessons.set(id, result);
                    this.saveStatus(id, 'READY');
                    return result;
                }
            }
            catch {
            }
        }
        return { status: 'PENDING', segments: [], errorMessage: null };
    }
    async prepareTranscript(id) {
        const video = await this.catalog.findVideo(id);
        const existing = this.readTranscript(id);
        if (existing.status === 'READY' || existing.status === 'PROCESSING')
            return existing;
        const state = {
            status: 'PROCESSING',
            segments: [],
            errorMessage: null,
        };
        this.lessons.set(id, state);
        await this.catalog.setTranscriptStatus(id, 'PROCESSING').catch(() => { });
        void (async () => {
            try {
                const directory = (0, path_1.join)(process.cwd(), 'storage', 'featured-videos', id);
                (0, fs_1.mkdirSync)(directory, { recursive: true });
                const segments = await this.videoTranslate.prepareFeaturedTranscript(id, video.duration, directory);
                if (!segments.length)
                    throw new Error('Empty transcript');
                (0, fs_1.writeFileSync)(this.cachePath(id), JSON.stringify(segments), 'utf8');
                this.lessons.set(id, { status: 'READY', segments, errorMessage: null });
                this.saveStatus(id, 'READY');
            }
            catch (error) {
                this.logger.warn(`Featured video ${id}: ${error instanceof Error ? error.message : String(error)}`);
                this.lessons.set(id, {
                    status: 'FAILED',
                    segments: [],
                    errorMessage: 'Chưa tải được phụ đề song ngữ. Bạn có thể tiếp tục xem video hoặc thử lại.',
                });
                this.saveStatus(id, 'FAILED');
            }
        })();
        return state;
    }
    saveStatus(id, status) {
        void this.catalog.setTranscriptStatus(id, status).catch(() => { });
    }
    cachePath(id, version = 3) {
        return (0, path_1.join)(process.cwd(), 'storage', 'featured-videos', id, `transcript-v${version}.json`);
    }
};
exports.FeaturedVideoService = FeaturedVideoService;
exports.FeaturedVideoService = FeaturedVideoService = FeaturedVideoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [video_translate_service_1.VideoTranslateService,
        podcast_catalog_service_1.PodcastCatalogService])
], FeaturedVideoService);
//# sourceMappingURL=featured-video.service.js.map