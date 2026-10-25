import { useState } from 'react';
import { latestAttempts, summarizeProgress } from '../model/progress';
import {
  MODE_LABELS,
  type Attempt,
  type ExerciseMode,
  type Segment,
} from '../model/types';
import ExerciseFeedback from './ExerciseFeedback';

export default function ListeningReview({
  segments,
  attempts,
  modes,
  onRetry,
  onClose,
}: {
  segments: Segment[];
  attempts: Attempt[];
  modes: ExerciseMode[];
  onRetry: (index: number, mode: ExerciseMode) => void;
  onClose: () => void;
}) {
  const [onlyWeak, setOnlyWeak] = useState(false);
  const [selected, setSelected] = useState<Attempt | null>(null);
  const latest = latestAttempts(attempts);
  const summary = summarizeProgress(segments, modes, attempts);
  return (
    <section className="lp-review" aria-label="Xem lại kết quả">
      <div className="lp-section-heading">
        <h2>Kết quả luyện tập</h2>
        <button type="button" onClick={onClose}>
          Tiếp tục học
        </button>
      </div>
      <div className="lp-stats">
        <div>
          <strong>{summary.percent}%</strong>
          <span>
            Đã làm {summary.attempted}/{summary.total}
          </span>
        </div>
        <div>
          <strong>{summary.average}%</strong>
          <span>Điểm trung bình</span>
        </div>
        <div>
          <strong>{summary.mastered}</strong>
          <span>Bài đạt từ 80%</span>
        </div>
      </div>
      <p className="lp-muted">
        Tiến độ đếm các bài đã nộp; điểm trung bình dùng lần nộp gần nhất ở từng
        câu và chế độ. Bỏ qua không tính hoàn thành. Điểm chép = số từ đúng /
        (số từ đáp án + từ thừa).
      </p>
      <label className="lp-check">
        <input
          type="checkbox"
          checked={onlyWeak}
          onChange={(e) => setOnlyWeak(e.target.checked)}
        />
        Chỉ xem bài đã làm dưới 80%
      </label>
      {!attempts.length && (
        <p>Chưa có kết quả. Hoàn thành một bài tập để xem phân tích.</p>
      )}
      <div className="lp-review-list">
        {segments.flatMap((segment, index) =>
          modes.map((mode) => {
            const attempt = latest.get(`${segment.id}:${mode}`);
            if (onlyWeak && (!attempt || attempt.grade.score >= 80))
              return null;
            return (
              <div key={`${segment.id}:${mode}`}>
                <button
                  type="button"
                  onClick={() => setSelected(attempt ?? null)}
                  disabled={!attempt}
                >
                  <span>
                    Câu {index + 1} · {MODE_LABELS[mode]}
                  </span>
                  <strong>
                    {attempt
                      ? `${attempt.grade.score}%${attempt.hints ? ' · có gợi ý' : ''}`
                      : 'Chưa làm'}
                  </strong>
                </button>
                <button type="button" onClick={() => onRetry(index, mode)}>
                  Luyện {attempt ? 'lại' : 'câu này'}
                </button>
              </div>
            );
          }),
        )}
      </div>
      {selected && (
        <ExerciseFeedback
          grade={selected.grade}
          hints={selected.hints}
          expected={
            segments.find((s) => s.id === selected.segmentId)?.[
              selected.mode === 'meaning' ? 'vietnamese' : 'english'
            ] ?? ''
          }
        />
      )}
    </section>
  );
}
