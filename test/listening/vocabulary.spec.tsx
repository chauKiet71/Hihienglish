/** @jest-environment jsdom */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
const mockLookup = jest.fn();
const mockLearn = jest.fn();
jest.mock('../../client/src/lib/api', () => ({
  api: { lookupVocabularyWord: mockLookup, saveVocabularyWord: mockLearn },
}));
jest.mock('../../client/src/lib/speech', () => ({
  speakEnglishText: jest.fn(),
}));
import WordDetail from '../../client/src/features/listening/components/WordDetail';
const segment = {
  id: 's1',
  english: 'I love traveling.',
  vietnamese: 'Tôi thích du lịch.',
  phonetic: '',
  time_start: 0,
  time_end: 2,
};
const detail = {
  id: 'v1',
  word: 'traveling',
  requestedWord: 'traveling',
  meaning: 'du lịch',
  definition: 'Going to another place.',
  synonyms: ['journeying'],
  phonetic: '',
  partOfSpeech: 'verb',
  example: 'I am traveling.',
  exampleTranslation: '',
  progress: null,
};
const props = () => ({
  word: 'traveling',
  segment,
  signedIn: false,
  source: { type: 'lesson' as const, id: 'lesson-01', startTime: 0, endTime: 2 },
  onClose: jest.fn(),
});
beforeEach(() => {
  jest.clearAllMocks();
  mockLookup.mockResolvedValue(detail);
  mockLearn.mockResolvedValue({ learned: true });
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
afterEach(cleanup);
describe('contextual vocabulary integration', () => {
  it('passes the sentence context and does not offer guest saving', async () => {
    await act(async () => {
      render(<WordDetail {...props()} />);
    });
    expect(mockLookup).toHaveBeenCalledWith({
      word: 'traveling',
      sentence: segment.english,
      sentenceTranslation: segment.vietnamese,
    });
    expect(screen.getByText('du lịch')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Lưu vào từ vựng' }),
    ).toBeNull();
  });
  it('recovers from a failed lookup when retried', async () => {
    mockLookup.mockRejectedValueOnce(new Error('Không có kết nối'));
    await act(async () => {
      render(<WordDetail {...props()} />);
    });
    expect(screen.getByRole('alert').textContent).toContain('Không có kết nối');
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Thử lại' })),
    );
    expect(screen.getByText('du lịch')).toBeTruthy();
    expect(mockLookup).toHaveBeenCalledTimes(2);
  });
  it('does not apply a late save to a different synonym', async () => {
    let resolve!: (result: unknown) => void;
    mockLearn.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    await act(async () => {
      render(<WordDetail {...props()} signedIn />);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào từ vựng' }));
    mockLookup.mockResolvedValueOnce({
      ...detail,
      id: 'v2',
      word: 'journeying',
    });
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'journeying' })),
    );
    await act(async () => resolve({ learned: true }));
    expect(
      screen.queryByRole('button', { name: 'Đã lưu vào từ vựng' }),
    ).toBeNull();
    expect(
      (
        screen.getByRole('button', {
          name: 'Lưu vào từ vựng',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });
  it('restores focus when the dialog unmounts', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(<WordDetail {...props()} />);
    });
    screen.getByRole('button', { name: 'Đóng tra từ' }).focus();
    view.unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
