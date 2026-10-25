export declare class LookupVocabularyWordDto {
    word: string;
    sentence: string;
    sentenceTranslation: string;
}
export declare class LearnVocabularyWordDto {
    wordId: string;
    correct?: boolean;
}
export declare class ReviewVocabularyWordDto {
    correct: boolean;
}
