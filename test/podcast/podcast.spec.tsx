import { catalogFixture } from '../helpers/podcast-catalog';
import { setCache } from '../../client/src/lib/prefetchCache';
import { PageDataKeys } from '../../client/src/lib/pageDataCache';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PodcastPage from '../../client/src/features/podcast/PodcastPage';
import { PODCAST_CHANNELS } from '../../client/src/features/podcast/catalog';
import { FavoritesProvider } from '../../client/src/contexts/FavoritesContext';
import { api } from '../../client/src/lib/api';
import SavedVideoLessons from '../../client/src/features/youtube/SavedVideoLessons';

jest.mock('../../client/src/lib/api', () => ({
  api: {
    getPodcastCatalog: jest.fn(),
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
  useShadowing: () => ({
    result: null,
    error: '',
    isRecording: false,
    isFetching: false,
    toggleRecording: jest.fn(),
    reset: jest.fn(),
  }),
}));
jest.mock('../../client/src/lib/youtubePlayer', () => ({
  loadYoutubeApi: () => Promise.resolve(),
}));
jest.mock('../../client/src/lib/speech', () => ({
  speakEnglishText: jest.fn(),
}));

const player = {
  destroy: jest.fn(),
  getCurrentTime: () => 0,
  getDuration: () => 0,
  playVideo: jest.fn(),
  pauseVideo: jest.fn(),
  seekTo: jest.fn(),
  setPlaybackRate: jest.fn(),
};
const segments = [
  { start: 0, end: 2, en: 'Hello, everyone.', vi: 'Xin chào mọi người.' },
];

beforeAll(() => {
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  window.scrollTo = jest.fn();
  HTMLElement.prototype.scrollIntoView = jest.fn();
  Element.prototype.scrollTo = jest.fn();
});
beforeEach(() => {
  setCache(
    PageDataKeys.podcastCatalog,
    catalogFixture.filter((channel) => channel.id !== 'volka-english'),
  );
  jest
    .mocked(api.getPodcastCatalog)
    .mockResolvedValue(
      catalogFixture.filter((channel) => channel.id !== 'volka-english'),
    );
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
  jest.clearAllMocks();
  localStorage.clear();
  window.YT = {
    PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
    Player: jest.fn().mockImplementation((_element, options) => {
      queueMicrotask(() => options.events.onReady({ target: player }));
      return player;
    }),
  };
  jest.mocked(api.prepareFeaturedVideoTranscript).mockResolvedValue({
    status: 'READY',
    segments,
    errorMessage: null,
  });
});
afterEach(cleanup);

function openPage(path = '/podcast') {
  return render(
    <FavoritesProvider>
      <MemoryRouter initialEntries={[path]}>
        <PodcastPage />
      </MemoryRouter>
    </FavoritesProvider>,
  );
}

it('offers 20 distinct real video links in each of the seven requested channels', () => {
  openPage();
  expect(PODCAST_CHANNELS.map((channel) => channel.handle)).toEqual([
    'bbclearningenglish',
    'voalearningenglish',
    'EasyEnglishVideos',
    'LukesEnglishPodcast',
    'TheBritishEnglishPodcast',
    'TheDiaryOfACEO',
    'TED',
  ]);
  for (const channel of PODCAST_CHANNELS) {
    expect(
      screen
        .getByRole('link', { name: `Xem tất cả video của ${channel.name}` })
        .getAttribute('href'),
    ).toBe(`/podcast?channel=${channel.id}`);
    const row = screen.getByRole('region', {
      name: `Video của ${channel.name}`,
    });
    const links = within(row).getAllByRole('link');
    expect(links).toHaveLength(20);
    expect(new Set(channel.videos.map((video) => video.id)).size).toBe(20);
    channel.videos.forEach((video, index) => {
      expect(video.id).toMatch(/^[a-zA-Z0-9_-]{11}$/);
      expect(video.duration).toBeGreaterThan(0);
      expect(links[index].getAttribute('href')).toBe(`/podcast?v=${video.id}`);
    });
  }
  expect(screen.queryByRole('link', { name: 'Luyện nói' })).toBeNull();
});

it('opens the chosen podcast as a bilingual video lesson and returns to its channel', async () => {
  openPage();
  const video = PODCAST_CHANNELS[0].videos[0];
  fireEvent.click(screen.getByRole('link', { name: `Phát: ${video.title}` }));
  await screen.findByText('Xin chào mọi người.');
  expect(
    screen.getByRole('heading', { level: 1, name: video.title }),
  ).toBeTruthy();
  expect(api.prepareFeaturedVideoTranscript).toHaveBeenCalledWith(
    video.id,
    expect.anything(),
  );
  expect((window.YT!.Player as jest.Mock).mock.calls[0][1].videoId).toBe(
    video.id,
  );
  expect(
    screen.getByRole('button', { name: 'Hiện bản dịch tiếng Việt' }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Tùy chỉnh tốc độ phát' }),
  ).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(
    screen.getByRole('link', { name: 'Trở về kênh BBC Learning English' }),
  );
  expect(screen.getAllByRole('region', { name: /^Video của / })).toHaveLength(
    7,
  );
  expect(player.destroy).toHaveBeenCalledTimes(1);
  expect(document.body.style.overflow).toBe('');
});

it('opens a shared video lesson URL and links back to the selected channel list', async () => {
  const video = PODCAST_CHANNELS[6].videos[19];
  openPage(`/podcast?channel=ted&v=${video.id}`);
  await screen.findByText('Xin chào mọi người.');
  expect(
    screen.getByRole('heading', { level: 1, name: video.title }),
  ).toBeTruthy();
  const back = screen.getByRole('link', { name: 'Trở về kênh TED' });
  expect(back.getAttribute('href')).toBe('/podcast?channel=ted');
  fireEvent.click(back);
  expect(
    within(
      screen.getByRole('region', { name: 'Danh sách video của TED' }),
    ).getAllByRole('link'),
  ).toHaveLength(20);
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('keeps the catalog available for an unknown video without creating an arbitrary embed', () => {
  openPage('/podcast?v=unknown');
  expect(screen.getByRole('status').textContent).toContain(
    'không có trong danh sách',
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getAllByRole('region', { name: /^Video của / })).toHaveLength(
    7,
  );
});

it('slides each channel independently with the keyboard after replacing arrow buttons', () => {
  openPage();
  const channel = PODCAST_CHANNELS[0];
  const row = screen.getByRole('region', { name: `Video của ${channel.name}` });
  const scrollBy = jest.fn();
  row.scrollBy = scrollBy;
  Object.defineProperty(
    row.querySelector('[data-carousel-item]'),
    'offsetWidth',
    { value: 280 },
  );
  expect(
    screen.queryByRole('button', { name: /^Video (trước|tiếp theo) của/ }),
  ).toBeNull();
  fireEvent.keyDown(row, { key: 'ArrowRight' });
  expect(scrollBy).toHaveBeenCalledWith({ left: 292, behavior: 'smooth' });
  const otherRow = screen.getByRole('region', { name: 'Video của TED' });
  const otherScroll = jest.fn();
  otherRow.scrollBy = otherScroll;
  Object.defineProperty(
    otherRow.querySelector('[data-carousel-item]'),
    'offsetWidth',
    {
      value: 280,
    },
  );
  fireEvent.keyDown(otherRow, { key: 'ArrowRight' });
  expect(otherScroll).toHaveBeenCalledWith({ left: 292, behavior: 'smooth' });
  expect(scrollBy).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(row, { key: 'ArrowLeft' });
  expect(scrollBy).toHaveBeenLastCalledWith({ left: -292, behavior: 'smooth' });
});

it('opens all twenty videos of the selected channel and returns to that list after learning', async () => {
  openPage();
  const channel = PODCAST_CHANNELS[6];
  fireEvent.click(
    screen.getByRole('link', { name: `Xem tất cả video của ${channel.name}` }),
  );
  expect(
    screen.getByRole('heading', { level: 1, name: channel.name }),
  ).toBeTruthy();
  expect(
    screen.queryByRole('region', { name: 'Video của BBC Learning English' }),
  ).toBeNull();
  const list = screen.getByRole('region', {
    name: `Danh sách video của ${channel.name}`,
  });
  const videos = within(list).getAllByRole('link');
  expect(videos).toHaveLength(20);
  channel.videos.forEach((video, index) => {
    expect(videos[index].getAttribute('href')).toBe(
      `/podcast?channel=${channel.id}&v=${video.id}`,
    );
  });
  expect(
    screen.getByRole('link', { name: 'YouTube' }).getAttribute('href'),
  ).toBe(channel.url);
  fireEvent.click(videos[19]);
  await screen.findByText('Xin chào mọi người.');
  expect(
    screen.getByRole('heading', { level: 1, name: channel.videos[19].title }),
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole('link', { name: `Trở về kênh ${channel.name}` }),
  );
  expect(
    screen.getByRole('heading', { level: 1, name: channel.name }),
  ).toBeTruthy();
  expect(
    within(
      screen.getByRole('region', {
        name: `Danh sách video của ${channel.name}`,
      }),
    ).getAllByRole('link'),
  ).toHaveLength(20);
  fireEvent.click(screen.getByRole('link', { name: 'Trở về Podcast' }));
  expect(screen.getAllByRole('region', { name: /^Video của / })).toHaveLength(
    7,
  );
});

it('returns an unknown channel URL to the catalog without opening a player', () => {
  openPage('/podcast?channel=unknown');
  expect(screen.getByRole('status').textContent).toContain(
    'Không tìm thấy kênh',
  );
  expect(screen.getAllByRole('region', { name: /^Video của / })).toHaveLength(
    7,
  );
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('opens a shared channel list but rejects videos from a different channel', () => {
  openPage(`/podcast?channel=ted&v=${PODCAST_CHANNELS[0].videos[0].id}`);
  expect(screen.getByRole('heading', { level: 1, name: 'TED' })).toBeTruthy();
  expect(
    within(
      screen.getByRole('region', { name: 'Danh sách video của TED' }),
    ).getAllByRole('link'),
  ).toHaveLength(20);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(api.prepareFeaturedVideoTranscript).not.toHaveBeenCalled();
  expect(screen.getByRole('status').textContent).toContain(
    'không có trong danh sách',
  );
});

it('saves vocabulary from the podcast transcript with the actual public video source', async () => {
  const video = PODCAST_CHANNELS[0].videos[0];
  jest.mocked(api.lookupVocabularyWord).mockResolvedValue({
    id: 'hello',
    word: 'hello',
    requestedWord: 'hello',
    meaning: 'xin chào',
    definition: 'A greeting',
    phonetic: '/həˈləʊ/',
    partOfSpeech: 'interjection',
    example: 'Hello, everyone.',
    exampleTranslation: 'Xin chào mọi người.',
    synonyms: [],
    relatedWords: [],
    source: 'catalog',
    progress: null,
    audioUrl: null,
  });
  jest
    .mocked(api.saveVocabularyWord)
    .mockResolvedValue({ id: 'saved-podcast-word', sources: [] } as never);
  openPage(`/podcast?v=${video.id}`);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Xem chi tiết từ hello' }),
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Lưu từ vựng', exact: true }),
  );
  await screen.findByRole('button', { name: 'Đã lưu từ vựng' });
  expect(api.saveVocabularyWord).toHaveBeenCalledWith(
    expect.objectContaining({
      word: 'hello',
      source: {
        type: 'featured-video',
        id: video.id,
        startTime: 0,
        endTime: 2,
      },
    }),
  );
});

it('persists a saved podcast lesson and renders a link back to its learning screen', async () => {
  const video = PODCAST_CHANNELS[0].videos[0];
  const view = openPage(`/podcast?v=${video.id}`);
  await screen.findByText('Xin chào mọi người.');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Lưu bài học' })).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Lưu bài học' }));
  expect(
    JSON.parse(localStorage.getItem('shadowing_favorite_lessons')!),
  ).toContain(`youtube:${video.id}`);
  view.unmount();
  render(
    <MemoryRouter>
      <SavedVideoLessons videos={[video]} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link').getAttribute('href')).toBe(
    `/podcast?channel=bbc&v=${video.id}`,
  );
  expect(screen.getByText(/BBC Learning English/)).toBeTruthy();
});
