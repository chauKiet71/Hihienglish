"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vocabularyKey = vocabularyKey;
exports.vocabularySenseKey = vocabularySenseKey;
const crypto_1 = require("crypto");
function vocabularyKey(value) {
    return value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}
function vocabularySenseKey(meaning) {
    return (0, crypto_1.createHash)('sha256').update(vocabularyKey(meaning)).digest('hex');
}
//# sourceMappingURL=vocabulary-key.js.map