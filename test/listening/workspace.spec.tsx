/** @jest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
let mockAccess = { canAccess: true, loading: false };
let mockUser: { id: string } | undefined;
const mockLesson = {
  id: 'lesson-test',
  title: 'Test lesson',
  audioUrl: '/test.mp3',
  thumbnailUrl: '/test.jpg',
  sentences: [
    {
      id: 's1',
      english: 'Hello world.',
      vietnamese: 'Xin chào.',
      phonetic: '',
      time_start: 0,
      time_end: 2,
    },
    {
      id: 's2',
      english: 'Good morning.',
      vietnamese: 'Chào buổi sáng.',
      phonetic: '',
      time_start: 2,
      time_end: 4,
    },
  ],
};
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'lesson-test' }),
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));
jest.mock('../../client/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));
jest.mock('../../client/src/contexts/LessonAccessContext', () => ({
  useCanAccessLesson: () => mockAccess,
}));
jest.mock('../../client/src/data/lessons', () => ({
  getLessonById: () => mockLesson,
}));
jest.mock('../../client/src/lib/api', () => ({ api: {} }));
jest.mock('../../client/src/lib/speech', () => ({
  speakEnglishText: jest.fn(),
}));
jest.mock('../../client/src/lib/shadowing', () => ({
  ShadowingClient: jest.fn(),
}));
import ListeningLessonPage from '../../client/src/features/listening/ListeningLessonPage';
import { gradeText } from '../../client/src/features/listening/model/grading';
import { storageKey } from '../../client/src/features/listening/model/progress';
const key = storageKey(undefined, 'lesson-test', 'short');
beforeEach(() => {
  localStorage.clear();
  mockAccess = { canAccess: true, loading: false };
  mockUser = undefined;
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: true }),
  });
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});
describe('practice page integration', () => {
  it('does not mount exercises while access is loading or denied', () => {
    mockAccess.loading = true;
    const view = render(<ListeningLessonPage />);
    expect(screen.getByRole('status').textContent).toContain('quyền truy cập');
    expect(screen.queryByTestId('listening-practice-audio')).toBeNull();
    mockAccess = { canAccess: false, loading: false };
    view.rerender(<ListeningLessonPage />);
    expect(screen.getByRole('heading', { name: 'Bài học Pro' })).toBeTruthy();
    expect(screen.queryByTestId('listening-practice-audio')).toBeNull();
  });
  it('resumes the correct mixed step after a new page mount', () => {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        segmentId: 's2',
        mode: 'mixed',
        step: 1,
        attempts: [],
      }),
    );
    render(<ListeningLessonPage />);
    expect(screen.getByLabelText('Câu bạn nghe được')).toBeTruthy();
    expect(screen.getByText('Câu 2 / 2')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(key)!).step).toBe(1);
  });
  it('keeps completed answers masked until transcript is explicitly revealed', () => {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        segmentId: 's1',
        mode: 'dictation',
        attempts: [
          {
            id: 'a1',
            segmentId: 's1',
            mode: 'dictation',
            answer: 'hello world',
            hints: 0,
            at: 1,
            grade: gradeText('Hello world.', 'hello world'),
          },
        ],
      }),
    );
    render(<ListeningLessonPage />);
    const transcript = screen.getByRole('navigation', {
      name: 'Các đoạn trong bài',
    });
    expect(transcript.textContent).not.toContain('Hello world.');
    expect(transcript.textContent).toContain('Đã làm');
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Hiện nội dung transcript' }),
    );
    expect(transcript.textContent).toContain('Hello world.');
  });
  it('clears a draft on sentence navigation and finishes without grading skips', () => {
    render(<ListeningLessonPage />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Chép chính tả', exact: true }),
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'first draft' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Câu sau' }));
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: /Bỏ qua/ }));
    expect(
      screen.getByRole('heading', { name: 'Kết quả luyện tập' }),
    ).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(key)!).attempts).toEqual([]);
  });
  it('switches to separate progress when the signed-in account changes', () => {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        segmentId: 's2',
        mode: 'dictation',
        attempts: [],
      }),
    );
    const view = render(<ListeningLessonPage />);
    expect(screen.getByText('Câu 2 / 2')).toBeTruthy();
    mockUser = { id: 'u1' };
    view.rerender(<ListeningLessonPage />);
    expect(screen.getByText('Câu 1 / 2')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(key)!).segmentId).toBe('s2');
  });
});
