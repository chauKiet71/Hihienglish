import { CategoriesService } from './categories.service';
import { PublicCatalogCacheService } from '../public-cache/public-catalog-cache.service';
export declare class CategoriesController {
    private categoriesService;
    private cache?;
    constructor(categoriesService: CategoriesService, cache?: PublicCatalogCacheService | undefined);
    findAll(): Promise<{
        id: string;
        name: string;
        description: string;
        icon: string;
        iconColor: string;
        imageUrl: string;
        lessonCount: number;
        isPopular: boolean;
    }[] | {
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
        icon: string;
        iconColor: string;
        imageUrl: string | null;
        lessonCount: number;
        isPopular: boolean;
    }[]>;
    findPopular(): Promise<{
        id: string;
        name: string;
        description: string;
        icon: string;
        iconColor: string;
        imageUrl: string;
        lessonCount: number;
        isPopular: boolean;
    }[] | {
        id: string;
        createdAt: Date;
        name: string;
        description: string | null;
        icon: string;
        iconColor: string;
        imageUrl: string | null;
        lessonCount: number;
        isPopular: boolean;
    }[]>;
}
