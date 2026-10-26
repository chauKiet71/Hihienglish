import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminPodcastsPage from '../../client/src/pages/admin/AdminPodcastsPage';
import { api } from '../../client/src/lib/api';
import { catalogFixture } from '../helpers/podcast-catalog';
import type { CatalogImportJob } from '../../src/podcast/catalog.types';

jest.mock('../../client/src/lib/api', () => ({
  api: {
    getAdminPodcastCatalog: jest.fn(),
    getPodcastImports: jest.fn(),
    startPodcastImport: jest.fn(),
    getPodcastImport: jest.fn(),
    commitPodcastImport: jest.fn(),
    addPodcastChannel: jest.fn(),
    setPodcastChannelVisible: jest.fn(),
    setPodcastVideoVisible: jest.fn(),
    getPodcastAccessMap: jest.fn(),
  },
}));
jest.mock('../../client/src/components/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
const candidate = (id: string) => ({
  id,
  title: `Bài nghe ${id}`,
  duration: 80,
  publishedAt: '2026-01-01',
  youtubeChannelId: catalogFixture[0].channelId,
});
const ready: CatalogImportJob = {
  id: 'job',
  channelId: 'volka-english',
  mode: 'OLDER',
  requestedCount: 30,
  status: 'READY',
  scannedCount: 50,
  importedCount: 0,
  errorMessage: null,
  candidates: [candidate('oldvideo001'), candidate('oldvideo002')],
  createdAt: '2026-01-01',
};
const flush = async () => {
  await act(async () => {});
};
async function open() {
  render(
    <MemoryRouter>
      <AdminPodcastsPage />
    </MemoryRouter>,
  );
  await flush();
  const card = screen.getByText('Volka English').closest('section')!;
  fireEvent.click(within(card).getByRole('button', { name: 'Quản lý video' }));
  await flush();
}
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(api.getAdminPodcastCatalog)
    .mockResolvedValue({ channels: catalogFixture, youtubeConfigured: true });
  jest.mocked(api.getPodcastImports).mockResolvedValue([]);
  jest.mocked(api.startPodcastImport).mockResolvedValue(ready);
  jest
    .mocked(api.commitPodcastImport)
    .mockResolvedValue({ ...ready, status: 'IMPORTED', importedCount: 1 });
});
afterEach(() => {
  cleanup();
  jest.useRealTimers();
});
it('previews older videos and imports only the selected rows', async () => {
  await open();
  fireEvent.click(screen.getByRole('button', { name: 'Lấy thêm video cũ' }));
  fireEvent.change(
    screen.getByRole('spinbutton', { name: 'Số video muốn thêm' }),
    { target: { value: '30' } },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Tìm video' }));
  await flush();
  expect(api.startPodcastImport).toHaveBeenCalledWith('volka-english', {
    mode: 'OLDER',
    count: 30,
  });
  expect(api.commitPodcastImport).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'Chọn: Bài nghe oldvideo002' }),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Thêm và hiển thị 1 video' }),
  );
  await flush();
  expect(api.commitPodcastImport).toHaveBeenCalledWith('job', ['oldvideo001']);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByText(/Đã thêm 1 video/)).toBeTruthy();
});
it('keeps the preview and selection on a failed commit, then allows retry', async () => {
  jest
    .mocked(api.commitPodcastImport)
    .mockRejectedValueOnce(new Error('Mất kết nối'));
  await open();
  fireEvent.click(screen.getByRole('button', { name: 'Lấy thêm video cũ' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tìm video' }));
  await flush();
  fireEvent.click(
    screen.getByRole('button', { name: 'Thêm và hiển thị 2 video' }),
  );
  await flush();
  expect(screen.getByRole('alert').textContent).toBe('Mất kết nối');
  expect(
    (screen.getByRole('checkbox', { name: 'Chọn tất cả' }) as HTMLInputElement)
      .checked,
  ).toBe(true);
  fireEvent.click(
    screen.getByRole('button', { name: 'Thêm và hiển thị 2 video' }),
  );
  await flush();
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('resumes a queued job from history and polls until the preview is ready', async () => {
  jest.useFakeTimers();
  jest
    .mocked(api.getPodcastImports)
    .mockResolvedValue([{ ...ready, status: 'QUEUED', candidates: [] }]);
  jest.mocked(api.getPodcastImport).mockResolvedValue(ready);
  await open();
  fireEvent.click(screen.getByRole('button', { name: /Đang chờ · 30 video/ }));
  expect(screen.getByText(/Phiên nhập vẫn tiếp tục/)).toBeTruthy();
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  expect(
    screen.getByRole('checkbox', { name: 'Chọn: Bài nghe oldvideo001' }),
  ).toBeTruthy();
});
it('separates refreshing new uploads from importing older videos', async () => {
  await open();
  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật video mới' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tìm video' }));
  await flush();
  expect(api.startPodcastImport).toHaveBeenCalledWith('volka-english', {
    mode: 'NEWER',
    count: 20,
  });
});
it('accepts a specific video URL for the chosen channel', async () => {
  await open();
  fireEvent.click(screen.getByRole('button', { name: 'Thêm bằng URL' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'URL video YouTube' }), {
    target: { value: 'https://youtu.be/manual00001' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Tìm video' }));
  await flush();
  expect(api.startPodcastImport).toHaveBeenCalledWith('volka-english', {
    mode: 'URL',
    count: 1,
    videoUrl: 'https://youtu.be/manual00001',
  });
});
it('makes missing YouTube setup explicit and prevents unusable import actions', async () => {
  jest
    .mocked(api.getAdminPodcastCatalog)
    .mockResolvedValue({ channels: catalogFixture, youtubeConfigured: false });
  await open();
  expect(screen.getByText(/Chưa kết nối YouTube/)).toBeTruthy();
  expect(
    (
      screen.getByRole('button', {
        name: 'Lấy thêm video cũ',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
it('hides an existing video without deleting or reimporting it', async () => {
  await open();
  const row = screen
    .getByRole('link', { name: catalogFixture[0].videos[0].title })
    .closest('tr')!;
  fireEvent.click(within(row).getByRole('button', { name: 'Đang hiện' }));
  await flush();
  expect(api.setPodcastVideoVisible).toHaveBeenCalledWith(
    catalogFixture[0].videos[0].id,
    false,
  );
});
