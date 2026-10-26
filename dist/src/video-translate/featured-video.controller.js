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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturedVideoController = void 0;
const common_1 = require("@nestjs/common");
const featured_video_service_1 = require("./featured-video.service");
const optional_jwt_auth_guard_1 = require("../auth/optional-jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const podcast_access_service_1 = require("../podcast/podcast-access.service");
let FeaturedVideoController = class FeaturedVideoController {
    featuredVideos;
    access;
    constructor(featuredVideos, access) {
        this.featuredVideos = featuredVideos;
        this.access = access;
    }
    async getTranscript(id, user) {
        const access = await this.access.getPlaybackAccess(id, user);
        const result = this.featuredVideos.getTranscript(id);
        return this.forViewer(result, access);
    }
    async prepareTranscript(id, user) {
        const access = await this.access.getPlaybackAccess(id, user);
        if (access.previewLimitSeconds === 0)
            return { status: 'READY', segments: [], errorMessage: null, access };
        return this.forViewer(this.featuredVideos.prepareTranscript(id), access);
    }
    forViewer(result, access) {
        return {
            ...result,
            segments: access.previewLimitSeconds === null
                ? result.segments
                : result.segments.filter((segment) => segment.end <= access.previewLimitSeconds),
            access,
        };
    }
};
exports.FeaturedVideoController = FeaturedVideoController;
__decorate([
    (0, common_1.Get)(':id/transcript'),
    (0, common_1.Header)('Cache-Control', 'private, no-store'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FeaturedVideoController.prototype, "getTranscript", null);
__decorate([
    (0, common_1.Post)(':id/transcript'),
    (0, common_1.Header)('Cache-Control', 'private, no-store'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FeaturedVideoController.prototype, "prepareTranscript", null);
exports.FeaturedVideoController = FeaturedVideoController = __decorate([
    (0, common_1.Controller)('featured-videos'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __metadata("design:paramtypes", [featured_video_service_1.FeaturedVideoService,
        podcast_access_service_1.PodcastAccessService])
], FeaturedVideoController);
//# sourceMappingURL=featured-video.controller.js.map