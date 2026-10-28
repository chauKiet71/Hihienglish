import { Controller, Get, Optional } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PublicCatalogCacheService } from '../public-cache/public-catalog-cache.service';
import {
  PublicCatalogKeys,
  LESSON_CATALOG_TTL_MS,
} from '../public-cache/public-catalog.keys';

@Controller('categories')
export class CategoriesController {
  constructor(
    private categoriesService: CategoriesService,
    @Optional() private cache?: PublicCatalogCacheService,
  ) {
    cache?.register(
      PublicCatalogKeys.categories,
      LESSON_CATALOG_TTL_MS,
      () => categoriesService.findAll(),
      true,
    );
    cache?.register(
      PublicCatalogKeys.popularCategories,
      LESSON_CATALOG_TTL_MS,
      () => categoriesService.findPopular(),
      true,
    );
  }

  @Get()
  findAll() {
    return (
      this.cache?.getOrLoad(
        PublicCatalogKeys.categories,
        LESSON_CATALOG_TTL_MS,
        () => this.categoriesService.findAll(),
      ) ?? this.categoriesService.findAll()
    );
  }

  @Get('popular')
  findPopular() {
    return (
      this.cache?.getOrLoad(
        PublicCatalogKeys.popularCategories,
        LESSON_CATALOG_TTL_MS,
        () => this.categoriesService.findPopular(),
      ) ?? this.categoriesService.findPopular()
    );
  }
}
