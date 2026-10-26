import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VideoLesson } from '../../client/src/features/youtube/VideoLessonPage';
import { FavoritesProvider } from '../../client/src/contexts/FavoritesContext';
import { api } from '../../client/src/lib/api';
import { useAuth } from '../../client/src/contexts/AuthContext';
import { VOLKA_VIDEOS } from '../../client/src/features/youtube/catalog';
import {
  PODCAST_ACCESS_CHANGED,
  type PodcastPlaybackAccess,
} from '../../client/src/lib/podcastAccess';

jest.mock('../../client/src/lib/api', () => ({
  api: {
    getPodcastPlaybackAccess: jest.fn(),
    prepareFeaturedVideoTranscript: jest.fn(),
    getFeaturedVideoTranscript: jest.fn(),
  },
}));
jest.mock('../../client/src/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../../client/src/lib/youtubePlayer', () => ({
  loadYoutubeApi: () => Promise.resolve(),
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
const video = VOLKA_VIDEOS[0];
const limited: PodcastPlaybackAccess = {
  videoId: video.id,
  isPremium: true,
  previewSeconds: 120,
  canListenFull: false,
  previewLimitSeconds: 120,
  premiumExpiresAt: null,
};
const full = { ...limited, canListenFull: true, previewLimitSeconds: null };
const segments = [
  { start: 0, end: 5, en: 'Preview sentence.', vi: 'Câu nghe thử.' },
  { start: 150, end: 155, en: 'Premium sentence.', vi: 'Câu Premium.' },
];
let currentTime = 0;
let options: {
  playerVars: Record<string, number | string>;
  events: Record<string, (event: unknown) => void>;
};
const player = {
  destroy: jest.fn(),
  getCurrentTime: jest.fn(() => currentTime),
  getDuration: () => video.duration,
  playVideo: jest.fn(),
  pauseVideo: jest.fn(),
  seekTo: jest.fn((time: number) => {
    currentTime = time;
  }),
  setPlaybackRate: jest.fn(),
  unMute: jest.fn(),
};
beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
  jest.clearAllMocks();
  localStorage.clear();
  currentTime = 0;
  jest
    .mocked(useAuth)
    .mockReturnValue({ user: { id: 'free' }, loading: false } as ReturnType<
      typeof useAuth
    >);
  jest.mocked(api.getPodcastPlaybackAccess).mockResolvedValue(limited);
  jest
    .mocked(api.prepareFeaturedVideoTranscript)
    .mockResolvedValue({ status: 'READY', segments, errorMessage: null });
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  Element.prototype.scrollTo = jest.fn();
  window.YT = {
    PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
    Player: jest.fn().mockImplementation((_element, next) => {
      options = next;
      queueMicrotask(() => next.events.onReady({ target: player }));
      return player;
    }),
  };
});
afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

async function open(search = '') {
  const view = render(
    <FavoritesProvider>
      <MemoryRouter initialEntries={[`/podcast${search}`]}>
        <VideoLesson video={video} backTo="/podcast" />
      </MemoryRouter>
    </FavoritesProvider>,
  );
  await act(async () => {});
  return view;
}
async function tick(milliseconds = 100) {
  await act(async () => {
    jest.advanceTimersByTime(milliseconds);
  });
}

it('waits for server entitlement before creating the player', async () => {
  let finish!: (value: PodcastPlaybackAccess) => void;
  jest.mocked(api.getPodcastPlaybackAccess).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await open();
  expect(window.YT!.Player).not.toHaveBeenCalled();
  expect(api.prepareFeaturedVideoTranscript).not.toHaveBeenCalled();
  await act(async () => {
    finish(limited);
  });
  expect(window.YT!.Player).toHaveBeenCalledTimes(1);
});

it('stops exactly at the Free preview boundary and presents the upgrade dialog', async () => {
  await open();
  expect(options.playerVars.end).toBe(120);
  currentTime = 119.9;
  await tick();
  expect(screen.queryByRole('dialog')).toBeNull();
  currentTime = 120;
  await tick();
  const dialog = screen.getByRole('dialog', { name: 'Nâng cấp Premium' });
  expect(
    within(dialog).getByText('Nâng cấp Premium để nghe tiếp toàn bộ podcast.'),
  ).toBeTruthy();
  expect(player.pauseVideo).toHaveBeenCalled();
  expect(player.seekTo).toHaveBeenLastCalledWith(120, true);
  expect(
    within(dialog)
      .getByRole('link', { name: 'Nâng cấp Premium' })
      .getAttribute('href'),
  ).toBe('/nang-cap');
});

it('stops a Free admin at the configured 20-second boundary', async () => {
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'free-admin', role: 'ADMIN', isPremium: false },
    loading: false,
  } as ReturnType<typeof useAuth>);
  jest.mocked(api.getPodcastPlaybackAccess).mockResolvedValue({
    ...limited,
    previewSeconds: 20,
    previewLimitSeconds: 20,
  });
  await open();
  expect(options.playerVars.end).toBe(20);
  currentTime = 19.9;
  await tick();
  expect(screen.queryByRole('dialog')).toBeNull();
  currentTime = 20;
  await tick();
  expect(screen.getByRole('dialog', { name: 'Nâng cấp Premium' })).toBeTruthy();
  expect(player.seekTo).toHaveBeenLastCalledWith(20, true);
  expect(player.pauseVideo).toHaveBeenCalled();
});

it('blocks seeking past the preview using the app timeline', async () => {
  await open();
  fireEvent.change(screen.getByRole('slider', { name: 'Tiến độ video' }), {
    target: { value: '250' },
  });
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(player.seekTo).not.toHaveBeenCalledWith(250, true);
  expect(player.playVideo).not.toHaveBeenCalled();
});

it('blocks timestamp deep links beyond the limit before autoplay', async () => {
  await open('?t=150');
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(player.playVideo).not.toHaveBeenCalled();
  expect(player.seekTo).not.toHaveBeenCalledWith(150, true);
});

it('blocks native YouTube seeks/play state changes beyond the limit', async () => {
  await open();
  currentTime = 300;
  await act(async () => {
    options.events.onStateChange({ data: 1, target: player });
  });
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(currentTime).toBe(120);
});

it('does not repeatedly seek when native pause/seek events arrive while the paywall is open', async () => {
  await open();
  player.pauseVideo.mockImplementationOnce(() =>
    options.events.onStateChange({ data: 2, target: player }),
  );
  player.seekTo.mockImplementationOnce((time) => {
    currentTime = time;
    options.events.onStateChange({ data: 3, target: player });
  });
  currentTime = 120;
  await tick();
  expect(player.seekTo).toHaveBeenCalledTimes(1);
  await tick(500);
  await act(async () => {
    options.events.onStateChange({ data: 1, target: player });
  });
  expect(player.seekTo).toHaveBeenCalledTimes(1);
  expect(player.pauseVideo).toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toBeTruthy();
});

it('shows the paywall at the preview end even when repeat mode is enabled', async () => {
  await open();
  fireEvent.click(screen.getByRole('button', { name: 'Lặp lại bài học' }));
  player.playVideo.mockClear();
  currentTime = 120;
  await act(async () => {
    options.events.onStateChange({ data: 0, target: player });
  });
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(player.playVideo).not.toHaveBeenCalled();
});

it.each(['premium', 'unlocked'] as const)(
  'allows full playback for %s access',
  async (kind) => {
    jest
      .mocked(api.getPodcastPlaybackAccess)
      .mockResolvedValue({ ...full, isPremium: kind === 'premium' });
    await open();
    currentTime = 300;
    await tick();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(options.playerVars.end).toBeUndefined();
    expect(screen.getByText('Câu Premium.')).toBeTruthy();
  },
);

it('shows an immediate gate and never loads the player for a zero-length preview', async () => {
  jest.mocked(api.getPodcastPlaybackAccess).mockResolvedValue({
    ...limited,
    previewSeconds: 0,
    previewLimitSeconds: 0,
  });
  await open();
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(window.YT!.Player).not.toHaveBeenCalled();
  expect(api.prepareFeaturedVideoTranscript).not.toHaveBeenCalled();
});

it('fails closed with a retry action when the access API fails', async () => {
  jest
    .mocked(api.getPodcastPlaybackAccess)
    .mockRejectedValueOnce(new Error('Mất kết nối'));
  await open();
  expect(window.YT!.Player).not.toHaveBeenCalled();
  expect(screen.getByRole('alert').textContent).toContain('Mất kết nối');
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại', exact: true }));
  await act(async () => {});
  expect(window.YT!.Player).toHaveBeenCalledTimes(1);
});

it.each(['Nghe lại', 'Đóng thông báo Premium'])(
  'restarts playback at zero via %s and still enforces the preview limit',
  async (button) => {
    await open();
    currentTime = 120;
    await tick();
    fireEvent.click(screen.getByRole('button', { name: button, exact: true }));
    expect(currentTime).toBe(0);
    expect(player.seekTo).toHaveBeenLastCalledWith(0, true);
    expect(player.playVideo).toHaveBeenCalledTimes(1);
    await tick();
    expect(screen.queryByRole('dialog')).toBeNull();
    currentTime = 120;
    await tick();
    expect(screen.getByRole('dialog')).toBeTruthy();
  },
);

it('does not expose transcript rows after the preview even if an old response contained them', async () => {
  await open();
  expect(screen.getByText('Câu nghe thử.')).toBeTruthy();
  expect(screen.queryByText('Câu Premium.')).toBeNull();
});

it('refreshes access when admin settings or Premium status change', async () => {
  await open();
  currentTime = 120;
  await tick();
  jest.mocked(api.getPodcastPlaybackAccess).mockResolvedValue(full);
  await act(async () => {
    window.dispatchEvent(new Event(PODCAST_ACCESS_CHANGED));
  });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByText('Câu Premium.')).toBeTruthy();
  expect(options.playerVars.end).toBeUndefined();
});

it('revalidates immediately when Premium expires during playback', async () => {
  jest.mocked(api.getPodcastPlaybackAccess).mockResolvedValueOnce({
    ...full,
    premiumExpiresAt: new Date(Date.now() + 1000).toISOString(),
  });
  await open();
  currentTime = 130;
  await tick(1000);
  await tick();
  expect(player.destroy).toHaveBeenCalled();
  expect(options.playerVars.end).toBe(120);
  expect(screen.getByRole('dialog')).toBeTruthy();
});

it('removes Premium playback and transcript immediately on logout while the new check is pending', async () => {
  jest.mocked(api.getPodcastPlaybackAccess).mockResolvedValueOnce(full);
  const view = await open();
  expect(screen.getByText('Câu Premium.')).toBeTruthy();
  let finish!: (access: PodcastPlaybackAccess) => void;
  jest.mocked(api.getPodcastPlaybackAccess).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  jest
    .mocked(useAuth)
    .mockReturnValue({ user: null, loading: false } as ReturnType<
      typeof useAuth
    >);
  view.rerender(
    <FavoritesProvider>
      <MemoryRouter>
        <VideoLesson video={video} backTo="/podcast" />
      </MemoryRouter>
    </FavoritesProvider>,
  );
  await act(async () => {});
  expect(player.destroy).toHaveBeenCalled();
  expect(screen.queryByText('Câu Premium.')).toBeNull();
  expect(
    (screen.getByRole('slider', { name: 'Tiến độ video' }) as HTMLInputElement)
      .disabled,
  ).toBe(true);
  await act(async () => {
    finish(limited);
  });
  expect(options.playerVars.end).toBe(120);
});

it('closing with Escape replays from zero without granting more playback', async () => {
  await open();
  currentTime = 120;
  await tick();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(currentTime).toBe(0);
  await tick();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.body.style.overflow).toBe('');
  expect(player.playVideo).toHaveBeenCalledTimes(1);
  currentTime = 130;
  await tick();
  expect(screen.getByRole('dialog')).toBeTruthy();
});
