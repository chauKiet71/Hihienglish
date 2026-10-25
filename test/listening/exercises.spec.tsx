/** @jest-environment jsdom */
import {
  act,
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react';
import TextExercise from '../../client/src/features/listening/components/TextExercise';
import ListeningSettings from '../../client/src/features/listening/components/ListeningSettings';
import { DEFAULT_SETTINGS } from '../../client/src/features/listening/model/types';

const segment = {
  id: 's1',
  english: 'I love traveling to new countries.',
  vietnamese: 'Tôi thích đi du lịch.',
  phonetic: '',
  time_start: 0,
  time_end: 2,
};
function props() {
  return {
    segment,
    mode: 'dictation' as const,
    settings: { ...DEFAULT_SETTINGS },
    distractors: [],
    onGrade: jest.fn(),
    onNext: jest.fn(),
    onReplay: jest.fn(),
    onPause: jest.fn(),
  };
}
afterEach(() => {
  cleanup();
  jest.useRealTimers();
});
describe('text exercise behavior', () => {
  it('suspends auto-next while vocabulary is open and resumes after closing', () => {
    jest.useFakeTimers();
    const p = props();
    p.settings.autoNext = true;
    const view = render(<TextExercise {...p} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: segment.english },
    });
    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra đáp án/ }));
    view.rerender(<TextExercise {...p} suspendAutoNext />);
    act(() => jest.advanceTimersByTime(3000));
    expect(p.onNext).not.toHaveBeenCalled();
    view.rerender(<TextExercise {...p} />);
    act(() => jest.advanceTimersByTime(1600));
    expect(p.onNext).toHaveBeenCalledTimes(1);
  });
  it('does not submit empty input', () => {
    const p = props();
    render(<TextExercise {...p} />);
    expect(
      (
        screen.getByRole('button', {
          name: /Kiểm tra đáp án/,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    expect(p.onGrade).not.toHaveBeenCalled();
  });
  it('submits only once and records explicit hints', () => {
    const p = props();
    render(<TextExercise {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Chữ cái đầu' }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: segment.english },
    });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(p.onGrade).toHaveBeenCalledTimes(1);
    expect(p.onGrade.mock.calls[0][2]).toBe(1);
    expect(screen.getByText(/100%/)).toBeTruthy();
  });
  it('replays an incorrect answer and allows a clean retry', () => {
    const p = props();
    render(<TextExercise {...p} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra đáp án/ }));
    expect(p.onReplay).toHaveBeenCalled();
    expect(p.onNext).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Luyện lại câu này' }));
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByLabelText('Kết quả câu trả lời')).toBeNull();
  });
  it('does not interpret normal typing as replay or skip', () => {
    const p = props();
    render(<TextExercise {...p} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'r' });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 's' });
    expect(p.onReplay).not.toHaveBeenCalled();
    expect(p.onNext).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole('textbox'), {
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
    });
    expect(p.onReplay).toHaveBeenCalledWith(true);
  });
  it('cancels auto-next when an exercise unmounts', () => {
    jest.useFakeTimers();
    const p = props();
    p.settings.autoNext = true;
    const view = render(<TextExercise {...p} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: segment.english },
    });
    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra đáp án/ }));
    view.unmount();
    act(() => jest.advanceTimersByTime(2000));
    expect(p.onNext).not.toHaveBeenCalled();
  });
  it('auto-checks filled blanks and advances only after feedback delay', () => {
    jest.useFakeTimers();
    const p = props();
    p.settings.autoCheck = true;
    p.settings.autoNext = true;
    render(
      <TextExercise
        {...p}
        mode="blank"
        segment={{ ...segment, english: 'hello hello' }}
      />,
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'hello' },
    });
    expect(p.onGrade).toHaveBeenCalledTimes(1);
    expect(p.onNext).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1600));
    expect(p.onNext).toHaveBeenCalledTimes(1);
  });
  it('clears draft and feedback when parent changes the exercise key', () => {
    const p = props();
    const view = render(<TextExercise key="s1" {...p} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'my draft' },
    });
    view.rerender(
      <TextExercise key="s2" {...p} segment={{ ...segment, id: 's2' }} />,
    );
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
  });
  it('allows removing and reusing Vietnamese tiles', () => {
    const p = props();
    render(
      <TextExercise
        {...p}
        mode="meaning"
        segment={{ ...segment, vietnamese: 'bạn và bạn' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sắp xếp từ' }));
    const tiles = screen.getAllByRole('button', { name: 'bạn', exact: true });
    fireEvent.click(tiles[0]);
    fireEvent.click(tiles[1]);
    expect(screen.getAllByRole('button', { name: 'Bỏ từ bạn' })).toHaveLength(
      2,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Bỏ từ bạn' })[0]);
    expect(screen.getAllByRole('button', { name: 'Bỏ từ bạn' })).toHaveLength(
      1,
    );
    expect((tiles[0] as HTMLButtonElement).disabled).toBe(false);
  });
  it('does not grade missing translations as a success', () => {
    const p = props();
    render(
      <TextExercise
        {...p}
        mode="meaning"
        segment={{ ...segment, vietnamese: '' }}
      />,
    );
    expect(screen.getByRole('status').textContent).toMatch(/chưa có bản dịch/);
    expect(
      screen.queryByRole('button', { name: /Kiểm tra đáp án/ }),
    ).toBeNull();
    expect(p.onGrade).not.toHaveBeenCalled();
  });
  it('does not allow removing the final mixed exercise', () => {
    render(
      <ListeningSettings
        settings={{ ...DEFAULT_SETTINGS, mixedModes: ['dictation'] }}
        onChange={jest.fn()}
      />,
    );
    expect(
      (
        screen.getByRole('checkbox', {
          name: 'Chép chính tả',
        }) as HTMLInputElement
      ).disabled,
    ).toBe(true);
  });
});
