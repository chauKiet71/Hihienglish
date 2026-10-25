import { useCallback, useEffect, useRef, useState } from 'react';
import {
  api,
  type VideoTranslateSegment,
  type VocabularyLookupDetail,
} from '../../lib/api';
import { vocabularyToken } from './transcriptWords';
import { lookupInSource, saveLookedUpWord } from '../../lib/savedVocabulary';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export function useVideoVocabulary(pause: () => void, videoId?: string) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const request = useRef(0);
  const [context, setContext] = useState<{
    word: string;
    sentence: string;
    sentenceTranslation: string;
    startTime: number;
    endTime: number;
  } | null>(null);
  const [detail, setDetail] = useState<VocabularyLookupDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );

  const lookup = useCallback(async (next: NonNullable<typeof context>) => {
    const id = ++request.current;
    setContext(next);
    setDetail(null);
    setError('');
    setLoading(true);
    setSaving(false);
    try {
      const result = await api.lookupVocabularyWord({ word: next.word, sentence: next.sentence, sentenceTranslation: next.sentenceTranslation });
      if (id === request.current) setDetail(videoId ? lookupInSource(result, { type: 'featured-video', id: videoId, startTime: next.startTime, endTime: next.endTime }) : result);
    } catch (error) {
      if (id === request.current)
        setError(
          error instanceof Error
            ? error.message
            : 'Không thể tra từ. Vui lòng thử lại.',
        );
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [videoId]);

  const open = useCallback(
    (value: string, segment: VideoTranslateSegment) => {
      const word = vocabularyToken(value);
      if (!word) return;
      pause();
      void lookup({
        word,
        sentence: segment.en,
        sentenceTranslation: segment.vi,
        startTime: segment.start,
        endTime: segment.end,
      });
    },
    [lookup, pause],
  );

  const close = useCallback(() => {
    request.current += 1;
    setContext(null);
    setDetail(null);
    setError('');
    setLoading(false);
    setSaving(false);
  }, []);

  return {
    context,
    detail,
    error,
    loading,
    saving,
    save: async () => {
      if (!detail || !context || !videoId || saving || detail.savedWordId) return;
      if (!user) { navigate('/dang-nhap', { state: { from: location.pathname + location.search } }); return; }
      const version = request.current;
      setSaving(true);
      setError('');
      try {
        const saved = await saveLookedUpWord(detail, { type: 'featured-video', id: videoId, startTime: context.startTime, endTime: context.endTime });
        if (version === request.current) setDetail((current) => current ? { ...current, savedWordId: saved.id, progress: saved } : current);
      } catch (error) {
        if (version === request.current) setError(error instanceof Error ? error.message : 'Không thể lưu từ.');
      } finally { if (version === request.current) setSaving(false); }
    },
    open,
    close,
    retry: () => {
      if (context) void lookup(context);
    },
    related: (word: string) => {
      if (context) void lookup({ ...context, word });
    },
  };
}
