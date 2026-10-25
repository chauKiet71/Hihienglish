import {
  api,
  type SavedVocabularySourceInput,
  type VocabularyLookupDetail,
} from './api';
import { invalidateCache, invalidateCacheByPrefix } from './prefetchCache';

export const SAVED_VOCABULARY_CHANGED = 'hihi:saved-vocabulary-changed';

export function lookupInSource(
  detail: VocabularyLookupDetail,
  source: SavedVocabularySourceInput,
): VocabularyLookupDetail {
  const key = `${source.type}:${source.id}:${source.startTime}:${source.endTime}`;
  return {
    ...detail,
    savedWordId: detail.savedSourceKeys?.includes(key)
      ? detail.savedWordId
      : null,
  };
}

export function vocabularyChanged() {
  invalidateCache(['saved-vocabulary']);
  invalidateCacheByPrefix('page-data:saved-vocabulary:');
  window.dispatchEvent(new Event(SAVED_VOCABULARY_CHANGED));
}

export async function saveLookedUpWord(
  detail: VocabularyLookupDetail,
  source: SavedVocabularySourceInput,
) {
  const saved = await api.saveVocabularyWord({
    requestedWord: detail.requestedWord,
    word: detail.word,
    meaning: detail.meaning,
    phonetic: detail.phonetic ?? undefined,
    partOfSpeech: detail.partOfSpeech ?? undefined,
    definition: detail.definition,
    source,
  });
  vocabularyChanged();
  return saved;
}
