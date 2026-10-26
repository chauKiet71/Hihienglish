"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodcastModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const podcast_access_controller_1 = require("./podcast-access.controller");
const podcast_access_service_1 = require("./podcast-access.service");
const podcast_catalog_service_1 = require("./podcast-catalog.service");
const podcast_import_service_1 = require("./podcast-import.service");
const youtube_catalog_service_1 = require("./youtube-catalog.service");
const podcast_catalog_controller_1 = require("./podcast-catalog.controller");
let PodcastModule = class PodcastModule {
};
exports.PodcastModule = PodcastModule;
exports.PodcastModule = PodcastModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [
            podcast_catalog_controller_1.PodcastCatalogController,
            podcast_access_controller_1.PodcastAccessController,
            podcast_catalog_controller_1.AdminPodcastCatalogController,
        ],
        providers: [
            podcast_catalog_service_1.PodcastCatalogService,
            podcast_access_service_1.PodcastAccessService,
            podcast_import_service_1.PodcastImportService,
            youtube_catalog_service_1.YoutubeCatalogService,
        ],
        exports: [podcast_access_service_1.PodcastAccessService, podcast_catalog_service_1.PodcastCatalogService],
    })
], PodcastModule);
//# sourceMappingURL=podcast.module.js.map