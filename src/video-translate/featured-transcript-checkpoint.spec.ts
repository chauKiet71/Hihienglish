import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import {
  DUBBED_PIPELINE_VERSION,
  VideoTranslateService,
} from './video-translate.service';

type Segment = { start: number; end: number; en: string; vi?: string };
type Transcript = { segments: Segment[]; words: Segment[] };
type Internals = {
  runWithConcurrency: <T, R>(
    items: T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<R>,
  ) => Promise<R[]>;
  prepareFeaturedTranscript: VideoTranslateService['prepareFeaturedTranscript'];
  openai: object;
  translateBatch: (batch: Segment[]) => Promise<Segment[]>;
  translateSegments: (
    batch: Segment[],
    directory: string,
    progress?: (done: number, total: number) => void,
  ) => Promise<Segment[]>;
  transcribeWithWhisper: (
    audio: string,
    duration: number,
  ) => Promise<Transcript>;
  transcribeAudioFile: (audio: string) => Promise<Transcript>;
  createWhisperChunk: (
    audio: string,
    offset: number,
    seconds: number,
    output: string,
  ) => Promise<void>;
  estimateWordTimings: (
    segment: Segment,
  ) => Array<{ start: number; end: number; text: string }>;
};

describe('Featured transcript resumable processing', () => {
  const root = resolve('node_modules/.cache/featured-checkpoints');
  let directory: string;
  let service: Internals;
  beforeEach(() => {
    mkdirSync(root, { recursive: true });
    directory = mkdtempSync(join(root, 'test-'));
    service = new VideoTranslateService(
      {} as never,
      { get: () => undefined } as never,
    ) as unknown as Internals;
    service.openai = {};
  });
  afterEach(() => {
    jest.restoreAllMocks();
    if (
      !resolve(directory).startsWith(root + '\\') &&
      !resolve(directory).startsWith(root + '/')
    )
      throw new Error('Unexpected temporary directory');
    rmSync(directory, { recursive: true, force: true });
  });

  it('resumes only failed translation batches and preserves sentence order', async () => {
    let failed = false;
    const translate = jest
      .spyOn(service, 'translateBatch')
      .mockImplementation(async (batch) => {
        if (batch[0].en === 'Sentence 24.' && !failed) {
          failed = true;
          throw new Error('Temporary provider error');
        }
        return batch.map((segment) => ({ ...segment, vi: `VI ${segment.en}` }));
      });
    const segments = Array.from({ length: 50 }, (_, index) => ({
      start: index * 2,
      end: index * 2 + 1,
      en: `Sentence ${index}.`,
    }));
    await expect(
      service.translateSegments(segments, directory),
    ).rejects.toThrow('Temporary provider');
    await Promise.resolve();
    const progress = jest.fn();
    const result = await service.translateSegments(
      segments,
      directory,
      progress,
    );
    expect(translate).toHaveBeenCalledTimes(4);
    expect(result.map((segment) => segment.en)).toEqual(
      segments.map((segment) => segment.en),
    );
    expect(progress).toHaveBeenLastCalledWith(3, 3);
    await service.translateSegments(segments, directory);
    expect(translate).toHaveBeenCalledTimes(4);
  });

  it('stops scheduling after a provider failure and waits for an in-flight checkpoint', async () => {
    const creditError = new Error('No credits remaining');
    let finish!: () => void;
    const worker = jest.fn(async (value: number) => {
      if (value === 0) throw creditError;
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      return value;
    });
    let settled = false;
    const result = service
      .runWithConcurrency([0, 1, 2, 3], 2, worker)
      .catch((error) => {
        settled = true;
        return error;
      });
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(worker).toHaveBeenCalledTimes(2);
    finish();
    expect(await result).toBe(creditError);
    expect(worker).toHaveBeenCalledTimes(2);
  });

  it('does not reuse a translation checkpoint with changed input timestamps', async () => {
    const translate = jest
      .spyOn(service, 'translateBatch')
      .mockImplementation(async (batch) =>
        batch.map((segment) => ({ ...segment, vi: 'Xin chào.' })),
      );
    await service.translateSegments(
      [{ start: 0, end: 1, en: 'Hello.' }],
      directory,
    );
    await service.translateSegments(
      [{ start: 5, end: 6, en: 'Hello.' }],
      directory,
    );
    expect(translate).toHaveBeenCalledTimes(2);
  });

  it('chunks large audio, restores absolute video timestamps and resumes from speech checkpoints', async () => {
    const audio = join(directory, 'audio.mp3');
    writeFileSync(audio, Buffer.alloc(21 * 1024 * 1024));
    const split = jest
      .spyOn(service, 'createWhisperChunk')
      .mockResolvedValue(undefined);
    const transcribe = jest
      .spyOn(service, 'transcribeAudioFile')
      .mockResolvedValueOnce({
        segments: [{ start: 5, end: 8, en: 'First.' }],
        words: [{ start: 5, end: 8, en: 'First.' }],
      })
      .mockResolvedValueOnce({
        segments: [{ start: 2, end: 4, en: 'Second.' }],
        words: [{ start: 2, end: 4, en: 'Second.' }],
      });
    const result = await service.transcribeWithWhisper(audio, 650);
    expect(result.segments).toEqual([
      { start: 5, end: 8, en: 'First.' },
      { start: 602, end: 604, en: 'Second.' },
    ]);
    expect(result.words[1].start).toBe(602);
    expect(split.mock.calls.map((call) => [call[1], call[2]])).toEqual([
      [0, 600],
      [600, 50],
    ]);
    expect(await service.transcribeWithWhisper(audio, 650)).toEqual(result);
    expect(transcribe).toHaveBeenCalledTimes(2);
    expect(split).toHaveBeenCalledTimes(2);
  });

  it('keeps estimated word times positive inside very short utterances', () => {
    const words = service.estimateWordTimings({
      start: 1,
      end: 1.05,
      en: 'Yes I did.',
    });
    words.forEach((word) => {
      expect(word.start).toBeGreaterThanOrEqual(1);
      expect(word.end).toBeLessThanOrEqual(1.05);
      expect(word.end).toBeGreaterThan(word.start);
    });
  });

  it('bounds the final word to video duration when resuming an English checkpoint', async () => {
    writeFileSync(
      join(directory, `english-v${DUBBED_PIPELINE_VERSION}.json`),
      JSON.stringify({
        durationSec: 2,
        segments: [
          {
            start: 1,
            end: 2,
            en: 'Thanks.',
            words: [{ text: 'Thanks.', start: 1, end: 2.04 }],
          },
        ],
      }),
    );
    jest
      .spyOn(service, 'translateBatch')
      .mockImplementation(async (batch) =>
        batch.map((segment) => ({ ...segment, vi: 'Cảm ơn.' })),
      );
    const result = await service.prepareFeaturedTranscript(
      'test',
      2,
      directory,
    );
    expect(result[0].end).toBe(2);
    expect(result[0].words?.[0].end).toBe(2);
  });
});
