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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewVocabularyWordDto = exports.LearnVocabularyWordDto = exports.LookupVocabularyWordDto = void 0;
const class_validator_1 = require("class-validator");
class LookupVocabularyWordDto {
    word;
    sentence;
    sentenceTranslation;
}
exports.LookupVocabularyWordDto = LookupVocabularyWordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], LookupVocabularyWordDto.prototype, "word", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], LookupVocabularyWordDto.prototype, "sentence", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], LookupVocabularyWordDto.prototype, "sentenceTranslation", void 0);
class LearnVocabularyWordDto {
    wordId;
    correct;
}
exports.LearnVocabularyWordDto = LearnVocabularyWordDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LearnVocabularyWordDto.prototype, "wordId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], LearnVocabularyWordDto.prototype, "correct", void 0);
class ReviewVocabularyWordDto {
    correct;
}
exports.ReviewVocabularyWordDto = ReviewVocabularyWordDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReviewVocabularyWordDto.prototype, "correct", void 0);
//# sourceMappingURL=vocabulary.dto.js.map