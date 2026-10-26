import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
  act,
} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VideoLessonPage from '../../client/src/features/youtube/VideoLessonPage';
import ChannelPage from '../../client/src/features/youtube/ChannelPage';
import { api } from '../../client/src/lib/api';
import { FavoritesProvider } from '../../client/src/contexts/FavoritesContext';
import { useShadowing } from '../../client/src/hooks/useShadowing';
import { speakEnglishText } from '../../client/src/lib/speech';
import SavedVideoLessons from '../../client/src/features/youtube/SavedVideoLessons';
import { VOLKA_VIDEOS } from '../../client/src/features/youtube/catalog';

jest.mock('../../client/src/lib/api', () => ({
  api: {
    getPodcastPlaybackAccess: jest.fn(),
    prepareFeaturedVideoTranscript: jest.fn(),
    getFeaturedVideoTranscript: jest.fn(),
    lookupVocabularyWord: jest.fn(),
    saveVocabularyWord: jest.fn(),
  },
}));
jest.mock('../../client/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'learner' }, isAuthenticated: true }),
}));
jest.mock('../../client/src/hooks/useShadowing', () => ({
  useShadowing: jest.fn(),
}));
jest.mock('../../client/src/lib/speech', () => ({
  speakEnglishText: jest.fn(),
}));

const shadowing = {
  result: null,
  error: '',
  isRecording: false,
  isFetching: false,
  isProcessing: false,
  status: 'idle' as const,
  toggleRecording: jest.fn(),
  reset: jest.fn(),
};
jest.mock('../../client/src/lib/youtubePlayer', () => ({
  loadYoutubeApi: () => Promise.resolve(),
}));

const segments = [
  { start: 0, end: 2, en: 'Hello.', vi: 'Xin chào.' },
  { start: 5, end: 8, en: 'How are you?', vi: 'Bạn khỏe không?' },
];
const player = {
  destroy: jest.fn(),
  getCurrentTime: jest.fn(() => 0),
  getDuration: () => 822,
  playVideo: jest.fn(),
  pauseVideo: jest.fn(),
  seekTo: jest.fn(),
  setPlaybackRate: jest.fn(),
  unMute: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest
    .mocked(api.getPodcastPlaybackAccess)
    .mockImplementation(async (videoId) => ({
      videoId,
      isPremium: false,
      previewSeconds: 120,
      canListenFull: true,
      previewLimitSeconds: null,
      premiumExpiresAt: null,
    }));
  player.getCurrentTime.mockReturnValue(0);
  jest.mocked(useShadowing).mockReturnValue(shadowing);
  jest.mocked(api.lookupVocabularyWord).mockResolvedValue({
    id: 'hello',
    word: 'hello',
    requestedWord: 'hello',
    phonetic: '/həˈləʊ/',
    meaning: 'xin chào',
    definition: 'A greeting',
    example: 'Hello, everyone.',
    exampleTranslation: 'Xin chào mọi người.',
    synonyms: [],
    relatedWords: [],
    source: 'catalog',
    partOfSpeech: 'interjection',
    progress: null,
    audioUrl: null,
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: true }),
  });
  Element.prototype.scrollTo = jest.fn();
  window.YT = {
    PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
    Player: jest.fn().mockImplementation((_element, options) => {
      queueMicrotask(() => options.events.onReady({ target: player }));
      return player;
    }),
  };
  jest
    .mocked(api.prepareFeaturedVideoTranscript)
    .mockResolvedValue({ status: 'READY', segments, errorMessage: null });
});
afterEach(cleanup);

function renderLesson(id = 'ErP_AKE3riY') {
  return render(
    <FavoritesProvider>
      <MemoryRouter initialEntries={[`/video/${id}`]}>
        <Routes>
          <Route path="/video/:videoId" element={<VideoLessonPage />} />
        </Routes>
      </MemoryRouter>
    </FavoritesProvider>,
  );
}

it('seeks the actual player when choosing a sentence and toggles translation', async () => {
  renderLesson();
  await screen.findByText('Bạn khỏe không?');
  await waitFor(() =>
    expect(
      (
        screen.getByRole('button', {
          name: 'Phát câu: How are you?',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Phát câu: How are you?' }),
  );
  expect(player.seekTo).toHaveBeenCalledWith(5, true);
  expect(player.playVideo).toHaveBeenCalledTimes(1);
  expect(
    screen
      .getByRole('button', { name: 'Phát câu: How are you?' })
      .closest('article')!
      .getAttribute('aria-current'),
  ).toBe('true');
  fireEvent.click(
    screen.getByRole('button', { name: 'Hiện bản dịch tiếng Việt' }),
  );
  expect(screen.queryByText('Bạn khỏe không?')).toBeNull();
  fireEvent.click(
    screen.getByRole('button', { name: 'Tùy chỉnh tốc độ phát' }),
  );
  fireEvent.click(screen.getByRole('menuitemradio', { name: '0.75x' }));
  expect(player.setPlaybackRate).toHaveBeenCalledWith(0.75);
});

it('opens the existing contextual dictionary without seeking the video', async () => {
  renderLesson();
  const word = await screen.findByRole('button', {
    name: 'Xem chi tiết từ hello',
  });
  await waitFor(() => expect((word as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(word);
  expect(player.pauseVideo).toHaveBeenCalled();
  expect(player.seekTo).not.toHaveBeenCalled();
  expect(api.lookupVocabularyWord).toHaveBeenCalledWith({
    word: 'hello',
    sentence: 'Hello.',
    sentenceTranslation: 'Xin chào.',
  });
  await screen.findByText('xin chào');
  fireEvent.click(
    screen.getByRole('button', { name: 'Nghe phát âm từ hello' }),
  );
  expect(speakEnglishText).toHaveBeenCalledWith('hello', 0.75);
});

it('saves a selected word with the featured-video source and original timestamps', async () => {
  jest
    .mocked(api.saveVocabularyWord)
    .mockResolvedValue({ id: 'saved-word', sources: [] } as never);
  renderLesson();
  const trigger = await screen.findByRole('button', {
    name: 'Xem chi tiết từ hello',
  });
  await waitFor(() =>
    expect((trigger as HTMLButtonElement).disabled).toBe(false),
  );
  fireEvent.click(trigger);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Lưu từ vựng', exact: true }),
  );
  await screen.findByRole('button', { name: 'Đã lưu từ vựng' });
  expect(api.saveVocabularyWord).toHaveBeenCalledWith(
    expect.objectContaining({
      word: 'hello',
      requestedWord: 'hello',
      source: {
        type: 'featured-video',
        id: 'ErP_AKE3riY',
        startTime: 0,
        endTime: 2,
      },
    }),
  );
});

it('persists saved videos across visits and allows removing them', async () => {
  const view = renderLesson();
  await screen.findByText('Bạn khỏe không?');
  fireEvent.click(screen.getByRole('button', { name: 'Lưu bài học' }));
  expect(
    JSON.parse(localStorage.getItem('shadowing_favorite_lessons')!),
  ).toContain('youtube:ErP_AKE3riY');
  view.unmount();
  renderLesson();
  await screen.findByText('Bạn khỏe không?');
  fireEvent.click(screen.getByRole('button', { name: 'Bỏ lưu bài học' }));
  expect(
    JSON.parse(localStorage.getItem('shadowing_favorite_lessons')!),
  ).not.toContain('youtube:ErP_AKE3riY');
});

it('retries a failed contextual dictionary request', async () => {
  jest
    .mocked(api.lookupVocabularyWord)
    .mockRejectedValueOnce(new Error('Mất kết nối tra từ'));
  renderLesson();
  const word = await screen.findByRole('button', {
    name: 'Xem chi tiết từ hello',
  });
  fireEvent.click(word);
  await screen.findByText('Mất kết nối tra từ');
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  await screen.findByText('xin chào');
  expect(api.lookupVocabularyWord).toHaveBeenCalledTimes(2);
});

it('ignores a late dictionary response after the sheet is closed', async () => {
  let complete!: (
    detail: Awaited<ReturnType<typeof api.lookupVocabularyWord>>,
  ) => void;
  jest.mocked(api.lookupVocabularyWord).mockReturnValueOnce(
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  renderLesson();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Xem chi tiết từ hello' }),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Đóng chi tiết từ vựng' }),
  );
  await act(async () => {
    complete({ word: 'late response' } as never);
  });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByText('late response')).toBeNull();
});

it('restarts playback at the end only when repeat is enabled', async () => {
  renderLesson();
  await waitFor(() =>
    expect(
      (
        screen.getByRole('button', {
          name: 'Lặp lại bài học',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  const events = (window.YT!.Player as jest.Mock).mock.calls[0][1].events;
  act(() => events.onStateChange({ data: 0, target: player }));
  expect(player.seekTo).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Lặp lại bài học' }));
  act(() => events.onStateChange({ data: 0, target: player }));
  expect(player.seekTo).toHaveBeenCalledWith(0, true);
  expect(player.playVideo).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Lặp lại bài học' }));
  player.seekTo.mockClear();
  act(() => events.onStateChange({ data: 0, target: player }));
  expect(player.seekTo).not.toHaveBeenCalled();
});

it('pauses the video and scores the selected sentence when speaking', async () => {
  const view = renderLesson();
  const sentence = await screen.findByRole('button', {
    name: 'Phát câu: How are you?',
  });
  await waitFor(() =>
    expect((sentence as HTMLButtonElement).disabled).toBe(false),
  );
  fireEvent.click(sentence);
  fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu Shadowing' }));
  expect(player.pauseVideo).toHaveBeenCalled();
  expect(shadowing.toggleRecording).toHaveBeenCalledWith('How are you?');
  jest
    .mocked(useShadowing)
    .mockReturnValue({ ...shadowing, status: 'recording', isRecording: true });
  view.rerender(
    <FavoritesProvider>
      <MemoryRouter initialEntries={['/video/ErP_AKE3riY']}>
        <Routes>
          <Route path="/video/:videoId" element={<VideoLessonPage />} />
        </Routes>
      </MemoryRouter>
    </FavoritesProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Dừng Shadowing' }));
  expect(shadowing.toggleRecording).toHaveBeenLastCalledWith('How are you?');
  jest.mocked(useShadowing).mockReturnValue({
    ...shadowing,
    status: 'done',
    result: {
      transcript: 'How are you',
      score: 90,
      words: [
        { word: 'How', correct: true },
        { word: 'are', correct: false },
        { word: 'you', correct: true },
      ],
    },
  });
  view.rerender(
    <FavoritesProvider>
      <MemoryRouter initialEntries={['/video/ErP_AKE3riY']}>
        <Routes>
          <Route path="/video/:videoId" element={<VideoLessonPage />} />
        </Routes>
      </MemoryRouter>
    </FavoritesProvider>,
  );
  expect(screen.getByText('Độ chính xác: 90%')).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Xem chi tiết từ are' }).className,
  ).toContain('text-red-500');
});

it('highlights the word at the real player timestamp', async () => {
  renderLesson();
  await screen.findByText('Bạn khỏe không?');
  await waitFor(() =>
    expect((window.YT!.Player as jest.Mock).mock.calls.length).toBe(1),
  );
  player.getCurrentTime.mockReturnValue(6.5);
  act(() =>
    (window.YT!.Player as jest.Mock).mock.calls[0][1].events.onStateChange({
      data: 1,
      target: player,
    }),
  );
  await waitFor(() =>
    expect(
      screen
        .getByRole('button', { name: 'Xem chi tiết từ are' })
        .getAttribute('data-active-word'),
    ).toBe('true'),
  );
});

it('renders saved videos with links back to their video lessons', () => {
  render(
    <MemoryRouter>
      <SavedVideoLessons videos={[VOLKA_VIDEOS[4]]} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link').getAttribute('href')).toBe(
    '/kenh/volka-english/video/ErP_AKE3riY',
  );
});

it('keeps the video available after subtitle failure and supports retry', async () => {
  jest.mocked(api.prepareFeaturedVideoTranscript).mockResolvedValueOnce({
    status: 'FAILED',
    segments: [],
    errorMessage: 'Phụ đề chưa sẵn sàng',
  });
  renderLesson();
  await screen.findByText('Phụ đề chưa sẵn sàng');
  fireEvent.click(screen.getByRole('button', { name: 'Tải lại phụ đề' }));
  await screen.findByText('Bạn khỏe không?');
  expect(api.prepareFeaturedVideoTranscript).toHaveBeenCalledTimes(2);
  expect(window.YT?.Player).toHaveBeenCalledTimes(1);
});

it('destroys the player on navigation and rejects unknown videos', async () => {
  const view = renderLesson();
  await screen.findByText('Bạn khỏe không?');
  await waitFor(() => expect(window.YT?.Player).toHaveBeenCalledTimes(1));
  view.unmount();
  expect(player.destroy).toHaveBeenCalledTimes(1);
  renderLesson('unknown');
  expect(screen.getByText('Không tìm thấy bài học video')).toBeTruthy();
  expect(api.prepareFeaturedVideoTranscript).toHaveBeenCalledTimes(1);
});

it('lists five lessons without format tabs or a language badge', () => {
  render(
    <MemoryRouter>
      <ChannelPage />
    </MemoryRouter>,
  );
  const lessonLinks = screen
    .getAllByRole('link')
    .filter((link) => link.getAttribute('href')?.includes('/video/'));
  expect(lessonLinks).toHaveLength(5);
  expect(screen.queryByRole('tablist')).toBeNull();
  expect(screen.queryByText('English')).toBeNull();
});
