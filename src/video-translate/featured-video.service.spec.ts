import { NotFoundException } from '@nestjs/common';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { FeaturedVideoService } from './featured-video.service';
import { findPublicVideo } from '../catalog/public-videos';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));
describe('FeaturedVideoService with database catalog', () => {
  const id = 'ErP_AKE3riY';
  const segments = [{ start: 0, end: 2, en: 'Hello.', vi: 'Xin chào.' }];
  let prepare: jest.Mock;
  let lookup: jest.Mock;
  let service: FeaturedVideoService;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(existsSync).mockReturnValue(false);
    prepare = jest.fn().mockResolvedValue(segments);
    lookup = jest.fn(async (videoId: string) => {
      const video = findPublicVideo(videoId);
      if (!video) throw new NotFoundException();
      return video;
    });
    service = new FeaturedVideoService(
      { prepareFeaturedTranscript: prepare } as never,
      {
        findVideo: lookup,
        setTranscriptStatus: jest.fn().mockResolvedValue(undefined),
      } as never,
    );
  });
  it('rejects an unknown or hidden video before reading storage or processing', async () => {
    await expect(
      service.prepareTranscript('../private'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prepare).not.toHaveBeenCalled();
    expect(existsSync).not.toHaveBeenCalled();
  });
  it('does not start paid processing from GET', async () => {
    expect((await service.getTranscript(id)).status).toBe('PENDING');
    expect(prepare).not.toHaveBeenCalled();
  });
  it('accepts an imported video absent from the bundled catalog', async () => {
    lookup.mockResolvedValue({
      id: 'new-video01',
      title: 'Imported',
      duration: 37,
    });
    expect((await service.prepareTranscript('new-video01')).status).toBe(
      'PROCESSING',
    );
    expect(prepare).toHaveBeenCalledWith(
      'new-video01',
      37,
      expect.stringContaining('new-video01'),
    );
    expect((await service.getTranscript('new-video01')).segments).toEqual(
      segments,
    );
  });
  it('shares concurrent requests and persists the result', async () => {
    let finish!: (value: typeof segments) => void;
    prepare.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const [first, second] = await Promise.all([
      service.prepareTranscript(id),
      service.prepareTranscript(id),
    ]);
    expect(second).toBe(first);
    expect(prepare).toHaveBeenCalledTimes(1);
    finish(segments);
    await Promise.resolve();
    expect(await service.getTranscript(id)).toEqual({
      status: 'READY',
      segments,
      errorMessage: null,
    });
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('transcript-v3.json'),
      JSON.stringify(segments),
      'utf8',
    );
    await service.prepareTranscript(id);
    expect(prepare).toHaveBeenCalledTimes(1);
  });
  it('reuses a valid disk cache after restart', async () => {
    jest.mocked(existsSync).mockReturnValue(true);
    jest.mocked(readFileSync).mockReturnValue(JSON.stringify(segments));
    expect((await service.prepareTranscript(id)).status).toBe('READY');
    expect(prepare).not.toHaveBeenCalled();
  });

  it('rebuilds oversized v2 captions on explicit preparation and leaves the old file intact', async () => {
    jest
      .mocked(existsSync)
      .mockImplementation((path) =>
        String(path).endsWith('transcript-v2.json'),
      );
    jest.mocked(readFileSync).mockReturnValue(
      JSON.stringify([
        {
          start: 0,
          end: 120,
          en: Array(300).fill('word').join(' '),
          vi: 'Old translation.',
        },
      ]),
    );
    expect((await service.getTranscript(id)).status).toBe('PENDING');
    expect(prepare).not.toHaveBeenCalled();
    await service.prepareTranscript(id);
    await Promise.resolve();
    expect((await service.getTranscript(id)).status).toBe('READY');
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('transcript-v3.json'),
      expect.any(String),
      'utf8',
    );
    expect(writeFileSync).not.toHaveBeenCalledWith(
      expect.stringContaining('transcript-v2.json'),
      expect.anything(),
      expect.anything(),
    );
  });

  it('keeps a readable legacy cache without regenerating translations', async () => {
    jest
      .mocked(existsSync)
      .mockImplementation((path) =>
        String(path).endsWith('transcript-v2.json'),
      );
    jest.mocked(readFileSync).mockReturnValue(JSON.stringify(segments));
    expect((await service.prepareTranscript(id)).status).toBe('READY');
    expect(prepare).not.toHaveBeenCalled();
  });
  it.each(
    [
      [
        { start: 0, end: 3, en: 'First.', vi: 'Thứ nhất.' },
        { start: 2, end: 4, en: 'Second.', vi: 'Thứ hai.' },
      ],
      [
        {
          start: 0,
          end: 2,
          en: 'Hello.',
          vi: 'Xin chào.',
          words: [{ text: 'Hello.', start: 1, end: 1 }],
        },
      ],
      [{ start: 0, end: 2, en: 'Hello.', vi: ' ' }],
    ].map((cached) => [cached]),
  )(
    'does not serve overlapping, invalid word timing or empty translation caches',
    async (cached) => {
      jest.mocked(existsSync).mockReturnValue(true);
      jest.mocked(readFileSync).mockReturnValue(JSON.stringify(cached));
      expect((await service.getTranscript(id)).status).toBe('PENDING');
      expect(prepare).not.toHaveBeenCalled();
      await service.prepareTranscript(id);
      await Promise.resolve();
      expect((await service.getTranscript(id)).status).toBe('READY');
      expect(prepare).toHaveBeenCalledTimes(1);
    },
  );
  it('exposes failure and retries on explicit preparation', async () => {
    prepare.mockRejectedValueOnce(new Error('Provider unavailable'));
    await service.prepareTranscript(id);
    await Promise.resolve();
    expect((await service.getTranscript(id)).status).toBe('FAILED');
    await service.prepareTranscript(id);
    await Promise.resolve();
    expect((await service.getTranscript(id)).status).toBe('READY');
    expect(prepare).toHaveBeenCalledTimes(2);
  });
  it('regenerates malformed cached timing', async () => {
    jest.mocked(existsSync).mockReturnValue(true);
    jest
      .mocked(readFileSync)
      .mockReturnValue(JSON.stringify([{ ...segments[0], end: -1 }]));
    expect((await service.prepareTranscript(id)).status).toBe('PROCESSING');
    expect((await service.getTranscript(id)).segments).toEqual(segments);
  });
});
