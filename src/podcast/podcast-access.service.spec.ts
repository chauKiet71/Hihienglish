import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_VIDEOS } from '../catalog/public-videos';
import { PodcastAccessService } from './podcast-access.service';
import { FeaturedVideoController } from '../video-translate/featured-video.controller';
import { FeaturedVideoService } from '../video-translate/featured-video.service';

const video = PUBLIC_VIDEOS[0];
const policy = { videoId: video.id, isPremium: true, previewSeconds: 120 };
let table: { findUnique: jest.Mock; findMany: jest.Mock; upsert: jest.Mock };
let service: PodcastAccessService;
beforeEach(() => {
  table = {
    findUnique: jest.fn().mockResolvedValue(policy),
    findMany: jest.fn().mockResolvedValue([policy]),
    upsert: jest.fn().mockImplementation(async ({ create }) => create),
  };
  service = new PodcastAccessService({
    podcastAccess: table,
  } as unknown as PrismaService);
});

it.each([
  null,
  { isPremium: false },
  { isPremium: true, premiumExpiresAt: new Date(0) },
  { role: 'ADMIN', isPremium: false },
  { role: 'ADMIN', isPremium: true, premiumExpiresAt: new Date(0) },
])('limits a guest/Free/expired viewer: %p', async (viewer) => {
  expect(await service.getPlaybackAccess(video.id, viewer)).toMatchObject({
    canListenFull: false,
    previewLimitSeconds: 120,
  });
});

it.each([
  { isPremium: true },
  { isPremium: true, premiumExpiresAt: new Date(Date.now() + 60_000) },
  { role: 'ADMIN', isPremium: true },
])(
  'allows full playback only for an active Premium subscription: %p',
  async (viewer) => {
    expect(await service.getPlaybackAccess(video.id, viewer)).toMatchObject({
      canListenFull: true,
      previewLimitSeconds: null,
    });
  },
);

it('enforces the configured 20-second limit on an admin with a Free subscription', async () => {
  table.findUnique.mockResolvedValue({ ...policy, previewSeconds: 20 });
  expect(
    await service.getPlaybackAccess(video.id, {
      role: 'ADMIN',
      isPremium: false,
    }),
  ).toMatchObject({ canListenFull: false, previewLimitSeconds: 20 });
});

it('keeps the subscription expiry deadline for Premium admins', async () => {
  const expiresAt = new Date(Date.now() + 60_000);
  expect(
    (
      await service.getPlaybackAccess(video.id, {
        role: 'ADMIN',
        isPremium: true,
        premiumExpiresAt: expiresAt,
      })
    ).premiumExpiresAt,
  ).toBe(expiresAt.toISOString());
});

it('keeps videos with no setting open and supports zero-length preview', async () => {
  table.findUnique.mockResolvedValueOnce(null);
  expect((await service.getPlaybackAccess(video.id)).canListenFull).toBe(true);
  table.findUnique.mockResolvedValueOnce({ ...policy, previewSeconds: 0 });
  expect((await service.getPlaybackAccess(video.id)).previewLimitSeconds).toBe(
    0,
  );
});

it('persists a policy by the catalog video id', async () => {
  expect(await service.setAccess(video.id, true, 120)).toEqual(policy);
  expect(table.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { videoId: video.id },
      update: { isPremium: true, previewSeconds: 120 },
    }),
  );
});

it.each([-1, 1.5, NaN, Infinity, 86400, video.duration])(
  'rejects an invalid preview duration %s',
  async (seconds) => {
    await expect(
      service.setAccess(video.id, true, seconds),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(table.upsert).not.toHaveBeenCalled();
  },
);

it('rejects unknown videos before touching storage', async () => {
  await expect(
    service.setAccess('not-a-podcast', true, 120),
  ).rejects.toBeInstanceOf(NotFoundException);
  await expect(
    service.getPlaybackAccess('not-a-podcast'),
  ).rejects.toBeInstanceOf(NotFoundException);
  expect(table.findUnique).not.toHaveBeenCalled();
});

it('excludes removed catalog videos from the public map', async () => {
  table.findMany.mockResolvedValue([policy, { ...policy, videoId: 'removed' }]);
  expect(await service.getAccessMap()).toEqual({ [video.id]: policy });
});

describe('transcript entitlement', () => {
  const segments = [
    { start: 0, end: 5, en: 'Preview', vi: 'Nghe thử' },
    { start: 115, end: 120, en: 'Boundary', vi: 'Giới hạn' },
    { start: 119, end: 125, en: 'Crossing boundary', vi: 'Qua giới hạn' },
    { start: 125, end: 130, en: 'Premium only', vi: 'Premium' },
  ];
  const transcript = { status: 'READY' as const, segments, errorMessage: null };
  let featured: { getTranscript: jest.Mock; prepareTranscript: jest.Mock };
  let controller: FeaturedVideoController;
  beforeEach(() => {
    featured = {
      getTranscript: jest.fn().mockReturnValue(transcript),
      prepareTranscript: jest.fn().mockReturnValue(transcript),
    };
    controller = new FeaturedVideoController(
      featured as unknown as FeaturedVideoService,
      service,
    );
  });
  it.each(['getTranscript', 'prepareTranscript'] as const)(
    'clips %s for Free without changing the shared full transcript',
    async (method) => {
      const result = await controller[method](video.id, null);
      expect(result.segments).toEqual(segments.slice(0, 2));
      expect(transcript.segments).toHaveLength(4);
      expect(
        (await controller[method](video.id, { isPremium: true })).segments,
      ).toHaveLength(4);
    },
  );
  it('does not prepare a full transcript for zero-length preview', async () => {
    table.findUnique.mockResolvedValue({ ...policy, previewSeconds: 0 });
    expect(
      (await controller.prepareTranscript(video.id, null)).segments,
    ).toEqual([]);
    expect(featured.prepareTranscript).not.toHaveBeenCalled();
  });
});
