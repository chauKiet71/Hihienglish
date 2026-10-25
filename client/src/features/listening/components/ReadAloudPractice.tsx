import { useEffect, useRef, useState } from 'react';
import type { Grade, Segment } from '../model/types';
import ExerciseFeedback from './ExerciseFeedback';
import { ShadowingClient } from '../../../lib/shadowing';
import { gradeText } from '../model/grading';

/** Separate client instance: disposing this exercise cannot stop another feature's recorder. */
export default function ReadAloudPractice({
  segment,
  onGrade,
  onNext,
  onPause,
  onReplay,
  autoNext,
  onBusyChange,
}: {
  segment: Segment;
  onGrade: (grade: Grade, answer: string, hints: number) => void;
  onNext: () => void;
  onPause: () => void;
  onReplay: (slow?: boolean) => void;
  autoNext: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const client = useRef<ShadowingClient | null>(null);
  const mounted = useRef(false);
  const busy = useRef(false);
  const [status, setStatus] = useState<
    'idle' | 'connecting' | 'recording' | 'processing' | 'done'
  >('idle');
  const [error, setError] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [recordedText, setRecordedText] = useState('');
  const isBusy =
    status === 'connecting' ||
    status === 'recording' ||
    status === 'processing';
  useEffect(() => {
    onBusyChange?.(isBusy);
    return () => onBusyChange?.(false);
  }, [isBusy, onBusyChange]);
  useEffect(() => {
    mounted.current = true;
    client.current = new ShadowingClient();
    return () => {
      mounted.current = false;
      client.current?.disconnect();
    };
  }, []);
  useEffect(() => {
    if (status !== 'recording') return;
    const timer = window.setTimeout(() => {
      client.current?.cancelRecording();
      busy.current = false;
      setStatus('idle');
      setError(
        'Đã dừng bản ghi sau 60 giây. Hãy đọc một câu ngắn rồi bấm Dừng và chấm.',
      );
    }, 60000);
    return () => window.clearTimeout(timer);
  }, [status]);
  useEffect(() => {
    if (!grade || grade.score < 80 || !autoNext) return;
    const timer = window.setTimeout(onNext, 1800);
    return () => window.clearTimeout(timer);
  }, [grade, autoNext, onNext]);
  const toggle = async () => {
    if (busy.current || !client.current) return;
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setError(
        'Trình duyệt chưa hỗ trợ thu âm. Hãy dùng Chrome hoặc Edge qua HTTPS/localhost.',
      );
      return;
    }
    const activeClient = client.current;
    busy.current = true;
    setError('');
    onPause();
    try {
      if (status === 'recording') {
        setStatus('processing');
        const result = await activeClient.stopRecording();
        if (!mounted.current) return;
        const comparison = gradeText(segment.english, result.transcript);
        // Existing shadowing evaluates recognized words, not individual phonemes.
        comparison.feedback =
          'Điểm đối chiếu lời nói được nhận dạng với câu mẫu; không phải đánh giá riêng từng âm vị hoặc ngữ điệu.';
        setGrade(comparison);
        setRecordedText(result.transcript);
        setStatus('done');
        onGrade(comparison, result.transcript, 0);
      } else {
        setGrade(null);
        setStatus('connecting');
        await activeClient.startRecording(segment.english);
        if (!mounted.current) {
          activeClient.disconnect();
          return;
        }
        setStatus('recording');
      }
    } catch (reason) {
      activeClient.cancelRecording();
      if (mounted.current) {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Không thể thu âm lúc này.',
        );
        setStatus('idle');
      }
    } finally {
      busy.current = false;
    }
  };
  return (
    <section className="lp-exercise" aria-label="Luyện đọc thành tiếng">
      <p className="lp-eyebrow">Nghe mẫu, sau đó đọc lại</p>
      <h2>{segment.english}</h2>
      <p className="lp-muted">
        {segment.phonetic || 'Chưa có phiên âm cho câu này.'}
      </p>
      <p className="lp-translation">{segment.vietnamese}</p>
      <button
        type="button"
        className={status === 'recording' ? 'lp-recording' : 'lp-primary'}
        disabled={status === 'connecting' || status === 'processing'}
        onClick={() => void toggle()}
      >
        {status === 'connecting'
          ? 'Đang kết nối…'
          : status === 'processing'
            ? 'Đang chấm…'
            : status === 'recording'
              ? 'Dừng và chấm'
              : 'Bắt đầu thu âm'}
      </button>
      {status === 'recording' && (
        <button
          type="button"
          onClick={() => {
            client.current?.cancelRecording();
            setStatus('idle');
          }}
        >
          Hủy bản ghi
        </button>
      )}
      <p className="lp-muted">
        Micro chỉ bật khi bạn bấm thu âm. Âm thanh được gửi tới dịch vụ chấm
        giọng nói hiện có của HihiEnglish.
      </p>
      {error && (
        <p role="alert" className="lp-error">
          {error}
        </p>
      )}
      {grade && (
        <>
          <p>Nhận dạng: {recordedText || '(Không nhận được lời nói)'}</p>
          <ExerciseFeedback
            grade={grade}
            expected={segment.english}
            hints={0}
          />
        </>
      )}
      <div className="lp-actions">
        <button type="button" disabled={isBusy} onClick={() => onReplay()}>
          Nghe mẫu
        </button>
        <button type="button" disabled={isBusy} onClick={() => onReplay(true)}>
          Nghe chậm
        </button>
        <button
          type="button"
          disabled={
            status === 'recording' ||
            status === 'processing' ||
            status === 'connecting'
          }
          onClick={onNext}
        >
          {grade ? 'Tiếp theo' : 'Bỏ qua'}
        </button>
      </div>
    </section>
  );
}
