import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminPodcastsPage from '../../client/src/pages/admin/AdminPodcastsPage';
import { api } from '../../client/src/lib/api';
import { invalidateCacheByPrefix } from '../../client/src/lib/prefetchCache';
import { PUBLIC_VIDEOS } from '../../src/catalog/public-videos';

jest.mock('../../client/src/lib/api', () => ({
  api: { getPodcastAccessMap: jest.fn(), setPodcastAccess: jest.fn() },
}));
jest.mock('../../client/src/components/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
const video = PUBLIC_VIDEOS[0];
beforeEach(() => {
  jest.clearAllMocks();
  invalidateCacheByPrefix('page-data:');
  jest.mocked(api.getPodcastAccessMap).mockResolvedValue({});
});
afterEach(cleanup);
async function open() {
  render(
    <MemoryRouter initialEntries={['/admin/content/podcasts']}>
      <AdminPodcastsPage />
    </MemoryRouter>,
  );
  await act(async () => {});
  fireEvent.change(screen.getByRole('textbox', { name: 'Tìm podcast' }), {
    target: { value: video.id },
  });
}
const save = () =>
  screen.getByRole('button', { name: `Lưu cài đặt: ${video.title}` });
const toggle = () =>
  screen.getByRole('switch', { name: `Premium: ${video.title}` });
const input = () =>
  screen.getByRole('spinbutton', {
    name: `Thời gian nghe thử: ${video.title}`,
  });

it('saves Premium and the configured preview time together', async () => {
  jest
    .mocked(api.setPodcastAccess)
    .mockResolvedValue({
      videoId: video.id,
      isPremium: true,
      previewSeconds: 120,
    });
  await open();
  expect((save() as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(toggle());
  fireEvent.click(save());
  await act(async () => {});
  expect(api.setPodcastAccess).toHaveBeenCalledWith(video.id, {
    isPremium: true,
    previewSeconds: 120,
  });
  expect(screen.getByRole('status').textContent).toContain('Đã lưu');
});

it.each(['-1', '1.5', String(video.duration), ''])(
  'prevents an invalid preview time %s',
  async (value) => {
    await open();
    fireEvent.click(toggle());
    fireEvent.change(input(), { target: { value } });
    expect((save() as HTMLButtonElement).disabled).toBe(true);
    expect(api.setPodcastAccess).not.toHaveBeenCalled();
  },
);

it('keeps a failed draft editable so the admin can retry', async () => {
  jest
    .mocked(api.setPodcastAccess)
    .mockRejectedValueOnce(new Error('Không lưu được'))
    .mockResolvedValue({
      videoId: video.id,
      isPremium: true,
      previewSeconds: 60,
    });
  await open();
  fireEvent.click(toggle());
  fireEvent.change(input(), { target: { value: '60' } });
  fireEvent.click(save());
  await act(async () => {});
  expect(screen.getByRole('alert').textContent).toContain('Không lưu được');
  expect((save() as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(save());
  await act(async () => {});
  expect(api.setPodcastAccess).toHaveBeenCalledTimes(2);
});

it('does not offer editable default settings when the load failed', async () => {
  jest
    .mocked(api.getPodcastAccessMap)
    .mockRejectedValueOnce(new Error('Mất kết nối'));
  await open();
  expect(screen.queryByRole('switch')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Tải lại' }));
  await act(async () => {});
  expect(toggle()).toBeTruthy();
});

it('filters Premium podcasts by committed settings', async () => {
  jest
    .mocked(api.getPodcastAccessMap)
    .mockResolvedValue({
      [video.id]: { videoId: video.id, isPremium: true, previewSeconds: 0 },
    });
  await open();
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Trạng thái Premium' }),
    { target: { value: 'premium' } },
  );
  expect(toggle().getAttribute('aria-checked')).toBe('true');
  expect((input() as HTMLInputElement).value).toBe('0');
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Trạng thái Premium' }),
    { target: { value: 'free' } },
  );
  expect(screen.queryByRole('switch')).toBeNull();
});
