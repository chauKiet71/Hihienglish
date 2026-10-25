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
exports.SavedVocabularyController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const saved_vocabulary_dto_1 = require("./dto/saved-vocabulary.dto");
const saved_vocabulary_service_1 = require("./saved-vocabulary.service");
let SavedVocabularyController = class SavedVocabularyController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(user, query) {
        return this.service.list(user.id, query);
    }
    session(user, query) {
        return this.service.session(user.id, query);
    }
    save(user, dto) {
        return this.service.save(user.id, dto);
    }
    remove(user, id) {
        return this.service.remove(user.id, id);
    }
    review(user, id, dto) {
        return this.service.review(user.id, id, dto);
    }
    replay(user, id, sourceId) {
        return this.service.replay(user.id, id, sourceId);
    }
};
exports.SavedVocabularyController = SavedVocabularyController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, saved_vocabulary_dto_1.SavedVocabularyQueryDto]),
    __metadata("design:returntype", void 0)
], SavedVocabularyController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('session'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, saved_vocabulary_dto_1.SavedVocabularyQueryDto]),
    __metadata("design:returntype", void 0)
], SavedVocabularyController.prototype, "session", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, saved_vocabulary_dto_1.SaveVocabularyDto]),
    __metadata("design:returntype", void 0)
], SavedVocabularyController.prototype, "save", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SavedVocabularyController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/review'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, saved_vocabulary_dto_1.ReviewSavedVocabularyDto]),
    __metadata("design:returntype", void 0)
], SavedVocabularyController.prototype, "review", null);
__decorate([
    (0, common_1.Get)(':id/sources/:sourceId/replay'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('sourceId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SavedVocabularyController.prototype, "replay", null);
exports.SavedVocabularyController = SavedVocabularyController = __decorate([
    (0, common_1.Controller)('vocabulary/saved'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [saved_vocabulary_service_1.SavedVocabularyService])
], SavedVocabularyController);
//# sourceMappingURL=saved-vocabulary.controller.js.map