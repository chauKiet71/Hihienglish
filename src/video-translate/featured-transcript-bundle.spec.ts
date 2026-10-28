import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { FeaturedVideoService } from './featured-video.service';
import { FeaturedVideoController } from './featured-video.controller';

const root = join(__dirname, '..', '..');
const manifest = JSON.parse(
  readFileSync(
    join(root, 'resources', 'podcast-transcripts', 'manifest.json'),
    'utf8',
  ),
) as {
  videos: Array<{ id: string; rows: number; duration: number }>;
};

describe('Deployed podcast transcripts with empty runtime storage', () => {
  let prepare: jest.Mock;
  let lookup: jest.Mock;
  let service: FeaturedVideoService;
  let emptyRuntime: string;
  const createService = () =>
    new FeaturedVideoService(
      { prepareFeaturedTranscript: prepare } as never,
      {
        findVideo: lookup,
        setTranscriptStatus: jest.fn().mockResolvedValue(undefined),
      } as never,
    );

  beforeEach(() => {
    emptyRuntime = join(root, 'storage', `empty-runtime-${randomUUID()}`);
    expect(existsSync(emptyRuntime)).toBe(false);
    jest.spyOn(process, 'cwd').mockReturnValue(emptyRuntime);
    prepare = jest
      .fn()
      .mockRejectedValue(new Error('External providers must not be called'));
    lookup = jest.fn(async (id: string) => {
      const video = manifest.videos.find((entry) => entry.id === id);
      if (!video) throw new NotFoundException();
      return video;
    });
    service = createService();
  });
  afterEach(() => jest.restoreAllMocks());

  it('serves every shipped bilingual transcript without local storage or provider calls', async () => {
    expect(manifest.videos.length).toBeGreaterThan(100);
    for (const entry of manifest.videos) {
      const result = await service.getTranscript(entry.id);
      expect(result.status).toBe('READY');
      expect(result.segments).toHaveLength(entry.rows);
      expect(
        result.segments.every((row) => row.en.trim() && row.vi.trim()),
      ).toBe(true);
    }
    expect(prepare).not.toHaveBeenCalled();
    expect(existsSync(emptyRuntime)).toBe(false);
  });
  it('loads ErP_AKE3riY after a process restart without regenerating its 174 rows', async () => {
    expect(
      (await service.prepareTranscript('ErP_AKE3riY')).segments,
    ).toHaveLength(174);
    expect(
      (await createService().getTranscript('ErP_AKE3riY')).segments,
    ).toHaveLength(174);
    expect(prepare).not.toHaveBeenCalled();
  });
  it('keeps Free viewers within the 20-second preview for bundled Premium transcripts', async () => {
    const id = 'H5qcIEH1iVs';
    const controller = new FeaturedVideoController(service, {
      getPlaybackAccess: async () => ({
        videoId: id,
        isPremium: true,
        previewSeconds: 20,
        previewLimitSeconds: 20,
        canListenFull: false,
        premiumExpiresAt: null,
      }),
    } as never);
    const result = await controller.prepareTranscript(id, null);
    expect(result.status).toBe('READY');
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.segments.every((segment) => segment.end <= 20)).toBe(true);
    expect((await service.getTranscript(id)).segments.length).toBeGreaterThan(
      result.segments.length,
    );
    expect(prepare).not.toHaveBeenCalled();
  });
  it('still refuses a hidden video even when a bundled transcript exists', async () => {
    lookup.mockRejectedValue(new NotFoundException());
    await expect(service.getTranscript('ErP_AKE3riY')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prepare).not.toHaveBeenCalled();
  });
});
