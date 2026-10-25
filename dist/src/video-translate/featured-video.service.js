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
const public_videos_1 = require("../catalog/public-videos");
const video_translate_service_1 = require("./video-translate.service");
let FeaturedVideoService = FeaturedVideoService_1 = class FeaturedVideoService {
    videoTranslate;
    logger = new common_1.Logger(FeaturedVideoService_1.name);
    lessons = new Map();
    constructor(videoTranslate) {
        this.videoTranslate = videoTranslate;
    }
    getTranscript(id) {
        this.findVideo(id);
        const existing = this.lessons.get(id);
        if (existing)
            return existing;
        const path = this.cachePath(id);
        if ((0, fs_1.existsSync)(path)) {
            try {
                const segments = JSON.parse((0, fs_1.readFileSync)(path, 'utf8'));
                if (Array.isArray(segments) &&
                    segments.length &&
                    segments.every((segment, index) => Number.isFinite(segment.start) &&
                        Number.isFinite(segment.end) &&
                        segment.end > segment.start &&
                        segment.start >= (segments[index - 1]?.start ?? 0) &&
                        typeof segment.en === 'string' &&
                        typeof segment.vi === 'string')) {
                    const result = {
                        status: 'READY',
                        segments,
                        errorMessage: null,
                    };
                    this.lessons.set(id, result);
                    return result;
                }
            }
            catch {
            }
        }
        return { status: 'PENDING', segments: [], errorMessage: null };
    }
    prepareTranscript(id) {
        const video = this.findVideo(id);
        const existing = this.getTranscript(id);
        if (existing.status === 'READY' || existing.status === 'PROCESSING')
            return existing;
        const state = {
            status: 'PROCESSING',
            segments: [],
            errorMessage: null,
        };
        this.lessons.set(id, state);
        void (async () => {
            try {
                const directory = (0, path_1.join)(process.cwd(), 'storage', 'featured-videos', id);
                (0, fs_1.mkdirSync)(directory, { recursive: true });
                const segments = await this.videoTranslate.prepareFeaturedTranscript(id, video.duration, directory);
                if (!segments.length)
                    throw new Error('Empty transcript');
                (0, fs_1.writeFileSync)(this.cachePath(id), JSON.stringify(segments), 'utf8');
                this.lessons.set(id, { status: 'READY', segments, errorMessage: null });
            }
            catch (error) {
                this.logger.warn(`Featured video ${id}: ${error instanceof Error ? error.message : String(error)}`);
                this.lessons.set(id, {
                    status: 'FAILED',
                    segments: [],
                    errorMessage: 'Chưa tải được phụ đề song ngữ. Bạn có thể tiếp tục xem video hoặc thử lại.',
                });
            }
        })();
        return state;
    }
    findVideo(id) {
        const video = (0, public_videos_1.findPublicVideo)(id);
        if (!video)
            throw new common_1.NotFoundException('Không tìm thấy bài học video');
        return video;
    }
    cachePath(id) {
        return (0, path_1.join)(process.cwd(), 'storage', 'featured-videos', id, 'transcript-v2.json');
    }
};
exports.FeaturedVideoService = FeaturedVideoService;
exports.FeaturedVideoService = FeaturedVideoService = FeaturedVideoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [video_translate_service_1.VideoTranslateService])
], FeaturedVideoService);
//# sourceMappingURL=featured-video.service.js.map