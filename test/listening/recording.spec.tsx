/** @jest-environment jsdom */
import {
  act,
  fireEvent,
  render,
  screen,
  cleanup,
} from '@testing-library/react';

const mockStart = jest.fn();
const mockStop = jest.fn();
const mockCancel = jest.fn();
const mockDisconnect = jest.fn();
jest.mock('../../client/src/lib/shadowing', () => ({
  ShadowingClient: jest.fn().mockImplementation(() => ({
    startRecording: mockStart,
    stopRecording: mockStop,
    cancelRecording: mockCancel,
    disconnect: mockDisconnect,
  })),
}));
import ReadAloudPractice from '../../client/src/features/listening/components/ReadAloudPractice';
const segment = {
  id: 's1',
  english: 'Hello world.',
  vietnamese: 'Xin chào.',
  phonetic: '',
  time_start: 0,
  time_end: 2,
};
const props = () => ({
  segment,
  onGrade: jest.fn(),
  onNext: jest.fn(),
  onReplay: jest.fn(),
  onPause: jest.fn(),
  autoNext: false,
});
beforeEach(() => {
  jest.clearAllMocks();
  mockStart.mockResolvedValue(undefined);
  mockStop.mockResolvedValue({
    transcript: 'hello world',
    score: 100,
    words: [],
  });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: jest.fn() },
  });
  Object.defineProperty(globalThis, 'MediaRecorder', {
    configurable: true,
    value: function () {},
  });
});
afterEach(cleanup);
describe('read-aloud lifecycle with mocked speech service', () => {
  it('blocks sample playback while recording and releases the player on cleanup', async () => {
    const p = props();
    const onBusyChange = jest.fn();
    const view = render(
      <ReadAloudPractice {...p} onBusyChange={onBusyChange} />,
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu thu âm' })),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Nghe mẫu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nghe chậm' }));
    expect(p.onReplay).not.toHaveBeenCalled();
    expect(onBusyChange).toHaveBeenLastCalledWith(true);
    view.unmount();
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });
  it('never opens the microphone on mount', () => {
    render(<ReadAloudPractice {...props()} />);
    expect(mockStart).not.toHaveBeenCalled();
  });
  it('pauses audio before starting and records the actual recognized result', async () => {
    const p = props();
    render(<ReadAloudPractice {...p} />);
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu thu âm' })),
    );
    expect(p.onPause).toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalledWith(segment.english);
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Dừng và chấm' })),
    );
    expect(p.onGrade).toHaveBeenCalledTimes(1);
    expect(p.onGrade.mock.calls[0][0].score).toBe(100);
  });
  it('shows permission errors without creating scores', async () => {
    mockStart.mockRejectedValueOnce(new Error('Microphone permission denied'));
    const p = props();
    render(<ReadAloudPractice {...p} />);
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu thu âm' })),
    );
    expect(screen.getByRole('alert').textContent).toContain(
      'permission denied',
    );
    expect(p.onGrade).not.toHaveBeenCalled();
    expect(mockCancel).toHaveBeenCalled();
  });
  it('disconnects an in-flight microphone request after unmount', async () => {
    let resolve!: () => void;
    mockStart.mockReturnValueOnce(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    const p = props();
    const view = render(<ReadAloudPractice {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu thu âm' }));
    view.unmount();
    await act(async () => resolve());
    expect(mockDisconnect).toHaveBeenCalledTimes(2);
    expect(p.onGrade).not.toHaveBeenCalled();
  });
  it('does not write a stale server result after changing sentence', async () => {
    let resolve!: (value: unknown) => void;
    mockStop.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const p = props();
    const view = render(<ReadAloudPractice {...p} />);
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu thu âm' })),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dừng và chấm' }));
    view.unmount();
    await act(async () => resolve({ transcript: 'hello world', score: 100 }));
    expect(p.onGrade).not.toHaveBeenCalled();
  });
});
