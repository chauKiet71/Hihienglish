import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import MyVideosPage from '../../client/src/pages/MyVideosPage';
import AddVideoButton from '../../client/src/features/video/AddVideoButton';
import {
  api,
  ApiError,
  type VideoTranslateJob,
  type VideoTranslateQuota,
} from '../../client/src/lib/api';

jest.mock('../../client/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'video-test-user' } }),
}));

jest.mock('../../client/src/lib/api', () => ({
  ApiError: class extends Error {
    constructor(
      message: string,
      public code?: string,
    ) {
      super(message);
    }
  },
  api: {
    listVideoTranslateJobs: jest.fn(),
    createVideoTranslateJob: jest.fn(),
    createVideoTranslateJobFromUpload: jest.fn(),
    getVideoTranslateJob: jest.fn(),
  },
}));

const quota = {} as VideoTranslateQuota;
const readyJob = { id: 'media-1', status: 'READY' } as VideoTranslateJob;
const pendingJob = { ...readyJob, status: 'PROCESSING' } as VideoTranslateJob;

function LocationProbe() {
  const { pathname, search, state } = useLocation();
  return (
    <output data-testid="location">
      {JSON.stringify({
        path: pathname + search,
        from: state?.from ?? null,
        job: state?.videoTranslateJob?.id ?? null,
      })}
    </output>
  );
}

function location() {
  return JSON.parse(screen.getByTestId('location').textContent!);
}

async function openPage(path = '/video-cua-toi') {
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <LocationProbe />
      <Routes>
        <Route path="/video-cua-toi" element={<MyVideosPage />} />
        <Route path="/" element={<AddVideoButton />} />
        <Route path="/dich-video" element={<div>Giao diện bài học</div>} />
        <Route path="/nang-cap" element={<div>Nâng cấp</div>} />
      </Routes>
    </MemoryRouter>,
  );
  await act(async () => {});
  fireEvent.click(
    screen.getByRole('button', { name: 'Thêm video', exact: true }),
  );
  return view;
}

async function finishSheetClosing() {
  await act(async () => {
    jest.advanceTimersByTime(440);
  });
}

async function openUrlDialog() {
  fireEvent.click(screen.getByRole('button', { name: /^URL Youtube/ }));
  await finishSheetClosing();
}

async function submitUrl() {
  fireEvent.change(screen.getByRole('textbox', { name: 'URL video Youtube' }), {
    target: { value: 'https://www.youtube.com/watch?v=H5qcIEH1iVs' },
  });
  fireEvent.submit(
    screen.getByRole('dialog', { name: 'URL Youtube', exact: true }),
  );
  await act(async () => {});
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.mocked(api.listVideoTranslateJobs).mockResolvedValue({ jobs: [] });
  jest
    .mocked(api.createVideoTranslateJob)
    .mockResolvedValue({ job: readyJob, quota });
  jest
    .mocked(api.createVideoTranslateJobFromUpload)
    .mockResolvedValue({ job: readyJob, quota });
  jest
    .mocked(api.getVideoTranslateJob)
    .mockResolvedValue({ job: readyJob, quota });
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

it('opens the source chooser in My Videos and closes with Escape without leaving the page', async () => {
  await openPage();
  expect(
    screen.getByRole('dialog', { name: 'Nhập Video hoặc Âm thanh' }),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: /^URL Youtube/ })).toBeTruthy();
  expect(screen.getByLabelText('Chọn phương tiện địa phương')).toBeTruthy();
  expect(location().path).toBe('/video-cua-toi');
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.keyDown(window, { key: 'Escape' });
  await finishSheetClosing();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.body.style.overflow).toBe('');
  expect(
    screen
      .getByRole('button', { name: 'Thêm video' })
      .getAttribute('aria-expanded'),
  ).toBe('false');
});

it('opens the URL form and enters the ready lesson after submitting a YouTube URL', async () => {
  await openPage();
  await openUrlDialog();
  expect(
    (
      screen.getByRole('button', {
        name: 'Lưu',
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  await submitUrl();
  expect(api.createVideoTranslateJob).toHaveBeenCalledWith(
    'https://www.youtube.com/watch?v=H5qcIEH1iVs',
  );
  expect(location()).toEqual({
    path: '/dich-video?job=media-1',
    from: null,
    job: 'media-1',
  });
  expect(document.body.style.overflow).toBe('');
});

it('uploads the selected local file and opens the ready lesson', async () => {
  await openPage();
  const input = screen.getByLabelText(
    'Chọn phương tiện địa phương',
  ) as HTMLInputElement;
  const file = new File(['test audio'], 'practice.mp3', { type: 'audio/mpeg' });
  fireEvent.change(input, { target: { files: [file] } });
  expect(api.createVideoTranslateJobFromUpload).not.toHaveBeenCalled();
  await finishSheetClosing();
  expect(api.createVideoTranslateJobFromUpload).toHaveBeenCalledWith(file);
  expect(api.createVideoTranslateJob).not.toHaveBeenCalled();
  expect(input.value).toBe('');
  expect(location().path).toBe('/dich-video?job=media-1');
});

it('keeps the source chooser open when the file picker is cancelled', async () => {
  await openPage();
  fireEvent.change(screen.getByLabelText('Chọn phương tiện địa phương'), {
    target: { files: [] },
  });
  await finishSheetClosing();
  expect(
    screen.getByRole('dialog', { name: 'Nhập Video hoặc Âm thanh' }),
  ).toBeTruthy();
  expect(api.createVideoTranslateJobFromUpload).not.toHaveBeenCalled();
});

it('shows processing progress until polling returns a ready lesson', async () => {
  jest
    .mocked(api.createVideoTranslateJob)
    .mockResolvedValue({ job: pendingJob, quota });
  jest
    .mocked(api.getVideoTranslateJob)
    .mockResolvedValueOnce({ job: pendingJob, quota })
    .mockResolvedValueOnce({ job: readyJob, quota });
  await openPage();
  await openUrlDialog();
  await submitUrl();
  expect(screen.getByRole('dialog', { name: 'Đang xử lý video' })).toBeTruthy();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.getByRole('dialog', { name: 'Đang xử lý video' })).toBeTruthy();
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(location().path).toBe('/dich-video?job=media-1');
  expect(api.getVideoTranslateJob).toHaveBeenCalledWith('media-1');
});

it('displays upload failures and lets the user close the dialog on the same page', async () => {
  jest
    .mocked(api.createVideoTranslateJobFromUpload)
    .mockRejectedValue(new Error('Không thể xử lý tệp'));
  await openPage();
  fireEvent.change(screen.getByLabelText('Chọn phương tiện địa phương'), {
    target: {
      files: [new File(['audio'], 'practice.mp3', { type: 'audio/mpeg' })],
    },
  });
  await finishSheetClosing();
  expect(screen.getByRole('alert').textContent).toBe('Không thể xử lý tệp');
  fireEvent.click(screen.getByRole('button', { name: 'Đóng', exact: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(location().path).toBe('/video-cua-toi');
  expect(document.body.style.overflow).toBe('');
});

it.each(['/video-cua-toi', '/'])(
  'keeps the correct return page for quota errors from %s',
  async (path) => {
    jest
      .mocked(api.createVideoTranslateJob)
      .mockRejectedValue(
        new ApiError('Hết lượt', 'VIDEO_TRANSLATE_QUOTA_EXCEEDED'),
      );
    await openPage(path);
    await openUrlDialog();
    await submitUrl();
    expect(location().path).toBe('/nang-cap');
    expect(location().from).toBe(path);
  },
);

it('restores page scrolling and clears the closing timer when unmounted', async () => {
  const view = await openPage();
  fireEvent.click(screen.getByRole('button', { name: /^URL Youtube/ }));
  view.unmount();
  await finishSheetClosing();
  expect(document.body.style.overflow).toBe('');
  expect(api.createVideoTranslateJob).not.toHaveBeenCalled();
});
