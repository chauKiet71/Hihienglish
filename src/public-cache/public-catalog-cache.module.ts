import { Global, Module } from '@nestjs/common';
import { PublicCatalogCacheService } from './public-catalog-cache.service';

@Global()
@Module({
  providers: [PublicCatalogCacheService],
  exports: [PublicCatalogCacheService],
})
export class PublicCatalogCacheModule {}
