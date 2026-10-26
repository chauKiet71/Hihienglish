import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PodcastPage from '../../client/src/features/podcast/PodcastPage';
import { api } from '../../client/src/lib/api';
import { invalidateCacheByPrefix } from '../../client/src/lib/prefetchCache';
import { catalogFixture } from '../helpers/podcast-catalog';

jest.mock('../../client/src/lib/api', () => ({
  api: { getPodcastCatalog: jest.fn() },
}));
jest.mock('../../client/src/features/youtube/VideoLessonPage', () => ({
  VideoLesson: ({ video }: { video: { title: string } }) => (
    <h1>{video.title}</h1>
  ),
}));
beforeEach(() => {
  invalidateCacheByPrefix('page-data:');
  jest.clearAllMocks();
  window.scrollTo = jest.fn();
});
afterEach(cleanup);
it('waits for server catalog before declaring a newly imported video missing', async () => {
  let finish!: (value: typeof catalogFixture) => void;
  jest.mocked(api.getPodcastCatalog).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  render(
    <MemoryRouter
      initialEntries={['/podcast?channel=new-channel&v=newvideo001']}
    >
      <PodcastPage />
    </MemoryRouter>,
  );
  expect(screen.getByRole('status').textContent).toBe('Đang tải Podcast…');
  expect(screen.queryByText(/không có trong danh sách/)).toBeNull();
  await act(async () => {
    finish([
      {
        ...catalogFixture[0],
        id: 'new-channel',
        name: 'New channel',
        videos: [
          {
            ...catalogFixture[0].videos[0],
            id: 'newvideo001',
            title: 'A newly imported lesson',
          },
        ],
      },
    ]);
  });
  expect(
    screen.getByRole('heading', { name: 'A newly imported lesson' }),
  ).toBeTruthy();
});
it('shows retry on a failed catalog request instead of restoring the old bundled list', async () => {
  jest
    .mocked(api.getPodcastCatalog)
    .mockRejectedValue(new Error('Không tải được dữ liệu'));
  render(
    <MemoryRouter>
      <PodcastPage />
    </MemoryRouter>,
  );
  await act(async () => {});
  expect(screen.getByRole('alert').textContent).toContain(
    'Không tải được dữ liệu',
  );
  expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy();
});
