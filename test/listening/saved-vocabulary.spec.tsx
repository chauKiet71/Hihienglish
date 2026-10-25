/** @jest-environment jsdom */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
jest.mock('react-router-dom', () => {
  Object.assign(globalThis, {
    TextEncoder: require('node:util').TextEncoder,
    TextDecoder: require('node:util').TextDecoder,
  });
  return jest.requireActual('react-router-dom');
});
import { MemoryRouter } from 'react-router-dom';
import VocabularyPage from '../../client/src/pages/VocabularyPage';
import VocabularyReview from '../../client/src/features/vocabulary/VocabularyReview';
import { lookupInSource } from '../../client/src/lib/savedVocabulary';
import { StatusBadge } from '../../client/src/features/vocabulary/WordContent';
import { api, type SavedVocabularyWord } from '../../client/src/lib/api';
import { speakEnglishText } from '../../client/src/lib/speech';

jest.mock('../../client/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'learner' }, loading: false }),
}));
jest.mock('../../client/src/lib/speech', () => ({
  speakEnglishText: jest.fn(),
}));
jest.mock('../../client/src/lib/api', () => ({
  api: {
    getSavedVocabulary: jest.fn(),
    getSavedVocabularySession: jest.fn(),
    reviewSavedVocabulary: jest.fn(),
    removeSavedVocabulary: jest.fn(),
    replaySavedVocabulary: jest.fn(),
    getSpeakingScenarios: jest.fn().mockResolvedValue([]),
    getSpeakingQuota: jest.fn().mockResolvedValue({}),
  },
}));
const word: SavedVocabularyWord = {
  id: 'saved-1',
  word: 'consistent',
  meaning: 'đều đặn',
  phonetic: '/kənˈsɪstənt/',
  partOfSpeech: 'Tính từ',
  definition: null,
  status: 'MASTERED',
  reviewCount: 4,
  correctCount: 4,
  streak: 4,
  lapses: 0,
  intervalDays: 18,
  easeFactor: 2.5,
  nextReviewAt: '2099-01-01T00:00:00Z',
  lastReviewedAt: null,
  createdAt: '2026-10-25T00:00:00Z',
  sources: [
    {
      id: 'source-1',
      sourceType: 'lesson',
      sourceId: 'lesson-01',
      title: 'Small habits',
      sentence: 'Small consistent actions matter.',
      sentenceTranslation: 'Hành động đều đặn rất quan trọng.',
      startTime: 2,
      endTime: 5,
    },
  ],
};
beforeEach(() => {
  jest.clearAllMocks();
  window.scrollTo = jest.fn();
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  jest.mocked(api.getSavedVocabulary).mockResolvedValue({
    words: [word],
    stats: { total: 1, due: 0, mastered: 1 },
    sources: [{ key: 'lesson:lesson-01', title: 'Small habits' }],
  });
  jest
    .mocked(api.getSavedVocabularySession)
    .mockResolvedValue({ words: [word] });
  jest.mocked(api.reviewSavedVocabulary).mockResolvedValue(word);
});
afterEach(cleanup);

it('labels a forgotten word as learning while waiting for its early review', () => {
  render(
    <StatusBadge word={{ ...word, status: 'LEARNING', reviewCount: 5 }} />,
  );
  expect(screen.getByText('Đang học')).toBeTruthy();
  expect(screen.queryByText('Mới lưu')).toBeNull();
});

it('allows saving another source without duplicating or resetting the existing word', () => {
  const detail = {
    savedWordId: 'saved-word',
    savedSourceKeys: ['lesson:lesson-01:2:5'],
  };
  expect(
    lookupInSource(detail as never, {
      type: 'lesson',
      id: 'lesson-01',
      startTime: 2,
      endTime: 5,
    }).savedWordId,
  ).toBe('saved-word');
  expect(
    lookupInSource(detail as never, {
      type: 'lesson',
      id: 'lesson-02',
      startTime: 2,
      endTime: 5,
    }).savedWordId,
  ).toBeNull();
});

it('starts a manual mastered session and keeps global review independent of filters', async () => {
  render(
    <MemoryRouter>
      <VocabularyPage />
    </MemoryRouter>,
  );
  await screen.findByRole('button', { name: 'Chi tiết từ consistent' });
  fireEvent.click(screen.getByRole('button', { name: 'Đã nhớ 1' }));
  await waitFor(() =>
    expect(
      jest.mocked(api.getSavedVocabulary).mock.calls.at(-1)![0],
    ).toMatchObject({ status: 'mastered' }),
  );
  await waitFor(() =>
    expect(
      (
        screen.getByRole('button', {
          name: 'Ôn lại',
          exact: true,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Ôn lại', exact: true }));
  await screen.findByRole('heading', { name: 'Ôn lại từ vựng' });
  expect(api.getSavedVocabularySession).toHaveBeenLastCalledWith(
    expect.objectContaining({ status: 'mastered' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Kết thúc lượt ôn' }));
  await waitFor(() =>
    expect(
      (
        screen.getByRole('button', {
          name: 'Ôn tất cả · 1 từ',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Ôn tất cả · 1 từ' }));
  await screen.findByRole('heading', { name: 'Ôn lại từ vựng' });
  expect(api.getSavedVocabularySession).toHaveBeenLastCalledWith({
    status: 'all',
  });
});

it('hides the answer until requested and records an actual self-assessment', async () => {
  render(<VocabularyReview words={[word]} onClose={jest.fn()} />);
  expect(screen.queryByText('đều đặn')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Chưa nhớ' })).toBeNull();
  fireEvent.click(
    screen.getByRole('button', { name: /Lật thẻ consistent để xem/ }),
  );
  expect(screen.getByText('đều đặn')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Chưa nhớ' }));
  await screen.findByRole('heading', { name: 'Đã hoàn thành lượt ôn' });
  expect(api.reviewSavedVocabulary).toHaveBeenCalledWith(
    word.id,
    expect.objectContaining({
      correct: false,
      expectedReviewCount: 4,
      requestId: expect.any(String),
    }),
  );
});

it('flips both ways while pronunciation controls leave the active face and progress unchanged', () => {
  render(<VocabularyReview words={[word]} onClose={jest.fn()} />);
  const flip = screen.getByRole('button', {
    name: /Lật thẻ consistent để xem/,
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Nghe phát âm consistent' }),
  );
  expect(speakEnglishText).toHaveBeenLastCalledWith('consistent', 0.85);
  expect(flip.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(flip);
  expect(flip.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByText('đều đặn')).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'consistent' })).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Nghe phát âm consistent' }),
  ).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Nghe câu ví dụ' }));
  expect(speakEnglishText).toHaveBeenLastCalledWith(
    word.sources[0].sentence,
    0.85,
  );
  expect(flip.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByText('đều đặn'));
  expect(flip.getAttribute('aria-pressed')).toBe('false');
  expect(screen.queryByText('đều đặn')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Chưa nhớ' })).toBeNull();
  expect(api.reviewSavedVocabulary).not.toHaveBeenCalled();
});

it('starts the next word on its question face after saving an assessment', async () => {
  render(
    <VocabularyReview
      words={[
        word,
        { ...word, id: 'saved-2', word: 'steady', meaning: 'ổn định' },
      ]}
      onClose={jest.fn()}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', { name: /Lật thẻ consistent để xem/ }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Đã nhớ', exact: true }));
  await screen.findByRole('heading', { name: 'steady' });
  expect(screen.queryByText('đều đặn')).toBeNull();
  expect(screen.queryByText('ổn định')).toBeNull();
  expect(
    screen
      .getByRole('button', { name: /Lật thẻ steady để xem/ })
      .getAttribute('aria-pressed'),
  ).toBe('false');
  expect(api.reviewSavedVocabulary).toHaveBeenCalledTimes(1);
});

it('keeps a failed answer on screen and retries it with the same idempotency key', async () => {
  jest
    .mocked(api.reviewSavedVocabulary)
    .mockRejectedValueOnce(new Error('Mất kết nối'));
  render(<VocabularyReview words={[word]} onClose={jest.fn()} />);
  fireEvent.click(
    screen.getByRole('button', { name: /Lật thẻ consistent để xem/ }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Đã nhớ', exact: true }));
  await screen.findByRole('button', { name: 'Thử lưu lại' });
  expect(
    (
      screen.getByRole('button', {
        name: /Lật thẻ consistent về mặt trước/,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(
    screen.queryByRole('heading', { name: 'Đã hoàn thành lượt ôn' }),
  ).toBeNull();
  const firstRequest = jest.mocked(api.reviewSavedVocabulary).mock.calls[0][1];
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Thử lưu lại' })),
  );
  expect(jest.mocked(api.reviewSavedVocabulary).mock.calls[1][1]).toEqual(
    firstRequest,
  );
  expect(
    screen.getByRole('heading', { name: 'Đã hoàn thành lượt ôn' }),
  ).toBeTruthy();
});

it('offers review for a mastered word from its detail sheet', async () => {
  render(
    <MemoryRouter>
      <VocabularyPage />
    </MemoryRouter>,
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Chi tiết từ consistent' }),
  );
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ôn lại từ này' }));
  await screen.findByRole('heading', { name: 'Ôn lại từ vựng' });
  expect(api.getSavedVocabularySession).toHaveBeenLastCalledWith({
    wordId: word.id,
  });
});
