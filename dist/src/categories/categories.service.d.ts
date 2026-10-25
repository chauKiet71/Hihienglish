import { PrismaService } from '../prisma/prisma.service';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
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
