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
exports.AdminPodcastCatalogController = exports.PodcastCatalogController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const admin_guard_1 = require("../auth/admin.guard");
const podcast_catalog_service_1 = require("./podcast-catalog.service");
const podcast_import_service_1 = require("./podcast-import.service");
const youtube_catalog_service_1 = require("./youtube-catalog.service");
const catalog_dto_1 = require("./dto/catalog.dto");
const public_catalog_cache_service_1 = require("../public-cache/public-catalog-cache.service");
const public_catalog_keys_1 = require("../public-cache/public-catalog.keys");
let PodcastCatalogController = class PodcastCatalogController {
    catalog;
    cache;
    constructor(catalog, cache) {
        this.catalog = catalog;
        this.cache = cache;
        cache?.register(public_catalog_keys_1.PublicCatalogKeys.podcasts, public_catalog_keys_1.PODCAST_CATALOG_TTL_MS, () => catalog.list());
    }
    list() {
        return (this.cache?.getOrLoad(public_catalog_keys_1.PublicCatalogKeys.podcasts, public_catalog_keys_1.PODCAST_CATALOG_TTL_MS, () => this.catalog.list()) ?? this.catalog.list());
    }
};
exports.PodcastCatalogController = PodcastCatalogController;
__decorate([
    (0, common_1.Get)('catalog'),
    (0, common_1.Header)('Cache-Control', 'no-store'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PodcastCatalogController.prototype, "list", null);
exports.PodcastCatalogController = PodcastCatalogController = __decorate([
    (0, common_1.Controller)('podcasts'),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [podcast_catalog_service_1.PodcastCatalogService,
        public_catalog_cache_service_1.PublicCatalogCacheService])
], PodcastCatalogController);
let AdminPodcastCatalogController = class AdminPodcastCatalogController {
    catalog;
    imports;
    youtube;
    constructor(catalog, imports, youtube) {
        this.catalog = catalog;
        this.imports = imports;
        this.youtube = youtube;
    }
    async list() {
        return {
            channels: await this.catalog.list(true),
            youtubeConfigured: this.youtube.configured,
        };
    }
    add(dto) {
        return this.catalog.addChannel(dto.url);
    }
    channelVisibility(id, dto) {
        return this.catalog.setChannelVisible(id, dto.isVisible);
    }
    videoVisibility(id, dto) {
        return this.catalog.setVideoVisible(id, dto.isVisible);
    }
    jobs(id) {
        return this.imports.list(id);
    }
    start(id, dto) {
        return this.imports.create(id, dto.mode, dto.count, dto.videoUrl);
    }
    job(id) {
        return this.imports.get(id);
    }
    commit(id, dto) {
        return this.imports.commit(id, dto.videoIds);
    }
};
exports.AdminPodcastCatalogController = AdminPodcastCatalogController;
__decorate([
    (0, common_1.Get)('catalog'),
    (0, common_1.Header)('Cache-Control', 'private, no-store'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminPodcastCatalogController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('channels'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [catalog_dto_1.AddPodcastChannelDto]),
    __metadata("design:returntype", void 0)
], AdminPodcastCatalogController.prototype, "add", null);
__decorate([
    (0, common_1.Patch)('channels/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, catalog_dto_1.PodcastVisibilityDto]),
    __metadata("design:returntype", void 0)
], AdminPodcastCatalogController.prototype, "channelVisibility", null);
__decorate([
    (0, common_1.Patch)('videos/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, catalog_dto_1.PodcastVisibilityDto]),
    __metadata("design:returntype", void 0)
], AdminPodcastCatalogController.prototype, "videoVisibility", null);
__decorate([
    (0, common_1.Get)('channels/:id/imports'),
    (0, common_1.Header)('Cache-Control', 'private, no-store'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminPodcastCatalogController.prototype, "jobs", null);
__decorate([
    (0, common_1.Post)('channels/:id/imports'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, catalog_dto_1.CreatePodcastImportDto]),
    __metadata("design:returntype", void 0)
], AdminPodcastCatalogController.prototype, "start", null);
__decorate([
    (0, common_1.Get)('imports/:id'),
    (0, common_1.Header)('Cache-Control', 'private, no-store'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminPodcastCatalogController.prototype, "job", null);
__decorate([
    (0, common_1.Post)('imports/:id/commit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, catalog_dto_1.CommitPodcastImportDto]),
    __metadata("design:returntype", void 0)
], AdminPodcastCatalogController.prototype, "commit", null);
exports.AdminPodcastCatalogController = AdminPodcastCatalogController = __decorate([
    (0, common_1.Controller)('admin/podcasts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [podcast_catalog_service_1.PodcastCatalogService,
        podcast_import_service_1.PodcastImportService,
        youtube_catalog_service_1.YoutubeCatalogService])
], AdminPodcastCatalogController);
//# sourceMappingURL=podcast-catalog.controller.js.map