import type { Grade } from '../model/types';

const LABELS = {
  correct: 'Đúng',
  wrong: 'Sai',
  missing: 'Thiếu',
  extra: 'Thừa',
};
export default function ExerciseFeedback({
  grade,
  expected,
  hints,
}: {
  grade: Grade;
  expected: string;
  hints: number;
}) {
  return (
    <section
      className="lp-feedback"
      aria-label="Kết quả câu trả lời"
      aria-live="polite"
    >
      <strong>
        {grade.score}% · {grade.score >= 80 ? 'Đạt mục tiêu' : 'Cần luyện thêm'}
      </strong>
      <p>
        {grade.correct} đúng · {grade.wrong} sai · {grade.missing} thiếu ·{' '}
        {grade.extra} thừa
      </p>
      {hints > 0 && <p>Đã dùng {hints} lượt gợi ý. Điểm này có hỗ trợ.</p>}
      {grade.feedback && <p>{grade.feedback}</p>}
      <div className="lp-comparison">
        {grade.comparison.map((word, i) => (
          <span key={i} className={`lp-word-${word.status}`}>
            <small>{LABELS[word.status]}</small>{' '}
            {word.status === 'wrong'
              ? `${word.actual} → ${word.expected}`
              : (word.expected ?? word.actual)}
          </span>
        ))}
      </div>
      <details>
        <summary>Xem đáp án tham khảo</summary>
        <p>{expected}</p>
      </details>
    </section>
  );
}
