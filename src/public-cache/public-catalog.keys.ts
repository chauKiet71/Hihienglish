export const PublicCatalogKeys = {
  podcasts: 'podcasts:catalog',
  categories: 'categories:all',
  popularCategories: 'categories:popular',
  lessons: (featured = false, categoryId?: string) =>
    `lessons:${featured ? 'featured' : 'all'}${categoryId ? `:category:${categoryId}` : ''}`,
};
export const PODCAST_CATALOG_TTL_MS = 5 * 60 * 1000;
export const LESSON_CATALOG_TTL_MS = 15 * 60 * 1000;
