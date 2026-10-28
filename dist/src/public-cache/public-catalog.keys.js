"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LESSON_CATALOG_TTL_MS = exports.PODCAST_CATALOG_TTL_MS = exports.PublicCatalogKeys = void 0;
exports.PublicCatalogKeys = {
    podcasts: 'podcasts:catalog',
    categories: 'categories:all',
    popularCategories: 'categories:popular',
    lessons: (featured = false, categoryId) => `lessons:${featured ? 'featured' : 'all'}${categoryId ? `:category:${categoryId}` : ''}`,
};
exports.PODCAST_CATALOG_TTL_MS = 5 * 60 * 1000;
exports.LESSON_CATALOG_TTL_MS = 15 * 60 * 1000;
//# sourceMappingURL=public-catalog.keys.js.map