import type { ListeningSettings as Settings } from '../model/types';
import { EXERCISE_MODES, MODE_LABELS } from '../model/types';

export default function ListeningSettings({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
}) {
  const toggle = (key: keyof Settings, label: string) => (
    <label className="lp-check" key={key}>
      <input
        type="checkbox"
        checked={settings[key] === true}
        onChange={(e) => onChange({ ...settings, [key]: e.target.checked })}
      />
      {label}
    </label>
  );
  return (
    <details className="lp-settings">
      <summary>Cài đặt luyện tập</summary>
      <div className="lp-settings-grid">
        <label className="lp-field">
          Độ dài đoạn
          <select
            value={settings.segmentLength}
            onChange={(e) =>
              onChange({
                ...settings,
                segmentLength: e.target.value as Settings['segmentLength'],
              })
            }
          >
            <option value="short">Câu ngắn gốc</option>
            <option value="long">Ghép các vế thành câu dài</option>
          </select>
        </label>
        <label className="lp-field">
          Tỷ lệ từ ẩn
          <select
            value={settings.difficulty}
            onChange={(e) =>
              onChange({
                ...settings,
                difficulty: Number(e.target.value) as Settings['difficulty'],
              })
            }
          >
            <option value={25}>Dễ · 25%</option>
            <option value={50}>Vừa · 50%</option>
            <option value={75}>Khó · 75%</option>
          </select>
        </label>
        {toggle('autoCheck', 'Tự chấm khi điền đủ từ')}
        {toggle('showWords', 'Hiện các từ để chọn')}
        {toggle('autoNext', 'Tự chuyển khi điểm đạt từ 80%')}
        {toggle('autoReplay', 'Nghe lại khi chưa đạt 80%')}
        {toggle('translation', 'Hiện bản dịch tiếng Việt')}
        {toggle('ipa', 'Hiện phiên âm IPA khi đọc')}
        {toggle('shortcuts', 'Bật phím tắt trong bài tập')}
        {toggle('soundEffects', 'Âm thanh phản hồi')}
      </div>
      <fieldset>
        <legend>Các bước trong chế độ Hỗn hợp</legend>
        <div className="lp-actions">
          {EXERCISE_MODES.map((mode) => (
            <label className="lp-check" key={mode}>
              <input
                type="checkbox"
                checked={settings.mixedModes.includes(mode)}
                disabled={
                  settings.mixedModes.length === 1 &&
                  settings.mixedModes.includes(mode)
                }
                onChange={(e) =>
                  onChange({
                    ...settings,
                    mixedModes: EXERCISE_MODES.filter((m) =>
                      m === mode
                        ? e.target.checked
                        : settings.mixedModes.includes(m),
                    ),
                  })
                }
              />
              {MODE_LABELS[mode]}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="lp-muted">
        Đổi độ dài đoạn sẽ mở bộ tiến độ riêng. Bài đang gõ sẽ được bắt đầu lại
        khi đổi độ khó hoặc chế độ.
      </p>
    </details>
  );
}
