export declare class VocabularySourceDto {
    type: 'lesson' | 'featured-video' | 'video';
    id: string;
    startTime: number;
    endTime: number;
}
export declare class SaveVocabularyDto {
    requestedWord: string;
    word: string;
    meaning: string;
    phonetic?: string;
    partOfSpeech?: string;
    definition?: string;
    source: VocabularySourceDto;
}
export declare class SavedVocabularyQueryDto {
    status?: 'all' | 'due' | 'mastered';
    search?: string;
    source?: string;
    sort?: 'newest' | 'alphabetical';
    wordId?: string;
}
export declare class ReviewSavedVocabularyDto {
    correct: boolean;
    requestId: string;
    expectedReviewCount: number;
}
