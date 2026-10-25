export interface CatalogSentence {
    id: string;
    english: string;
    phonetic?: string;
    vietnamese: string;
    time_start: number;
    time_end: number;
    words?: Array<{
        text: string;
        start: number;
        end: number;
    }>;
}
export interface CatalogLesson {
    id: string;
    categoryId: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    audioUrl: string;
    duration: number;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    topic: string;
    sentences: CatalogSentence[];
}
export interface CatalogCategory {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string;
    iconColor: string;
    imageUrl: string;
    lessonCount: number;
    isPopular: boolean;
}
export declare const CATALOG_CATEGORIES: CatalogCategory[];
export declare function loadCatalogLessons(): CatalogLesson[];
export declare function toLessonListDto(lesson: CatalogLesson): {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    audioUrl: string;
    duration: number;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    topic: string;
    categoryId: string;
    isFeatured: boolean;
    isNew: boolean;
    isHot: boolean;
    category: {
        id: string;
        name: string;
        icon: string;
        iconColor: string;
        imageUrl: string;
        lessonCount: number;
    } | null;
};
export declare function toLessonDetailDto(lesson: CatalogLesson): {
    transcripts: {
        id: string;
        orderIndex: number;
        englishText: string;
        vietnamese: string;
        startTime: number;
        endTime: number;
        phonetic: string;
        words: {
            text: string;
            start: number;
            end: number;
        }[];
    }[];
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    audioUrl: string;
    duration: number;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    topic: string;
    categoryId: string;
    isFeatured: boolean;
    isNew: boolean;
    isHot: boolean;
    category: {
        id: string;
        name: string;
        icon: string;
        iconColor: string;
        imageUrl: string;
        lessonCount: number;
    } | null;
};
export declare function listCatalogLessons(params?: {
    featured?: boolean;
    categoryId?: string;
}): {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    audioUrl: string;
    duration: number;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    topic: string;
    categoryId: string;
    isFeatured: boolean;
    isNew: boolean;
    isHot: boolean;
    category: {
        id: string;
        name: string;
        icon: string;
        iconColor: string;
        imageUrl: string;
        lessonCount: number;
    } | null;
}[];
export declare function getCatalogLesson(id: string): {
    transcripts: {
        id: string;
        orderIndex: number;
        englishText: string;
        vietnamese: string;
        startTime: number;
        endTime: number;
        phonetic: string;
        words: {
            text: string;
            start: number;
            end: number;
        }[];
    }[];
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    audioUrl: string;
    duration: number;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    topic: string;
    categoryId: string;
    isFeatured: boolean;
    isNew: boolean;
    isHot: boolean;
    category: {
        id: string;
        name: string;
        icon: string;
        iconColor: string;
        imageUrl: string;
        lessonCount: number;
    } | null;
} | null;
export declare function listCatalogCategories(popularOnly?: boolean): {
    id: string;
    name: string;
    description: string;
    icon: string;
    iconColor: string;
    imageUrl: string;
    lessonCount: number;
    isPopular: boolean;
}[];
