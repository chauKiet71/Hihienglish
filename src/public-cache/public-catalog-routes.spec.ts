import { PodcastCatalogController } from '../podcast/podcast-catalog.controller';
import { PodcastCatalogService } from '../podcast/podcast-catalog.service';
import { PodcastImportService } from '../podcast/podcast-import.service';
import { CategoriesController } from '../categories/categories.controller';
import { LessonsController } from '../lessons/lessons.controller';
import { PublicCatalogKeys } from './public-catalog.keys';

describe('Public catalog cache boundaries', () => {
  const makeCache = () => ({
    register: jest.fn(),
    getOrLoad: jest.fn((_key, _ttl, load) => load()),
    invalidate: jest.fn().mockResolvedValue(undefined),
  });
  it('caches public catalogs, leaving permission checks outside the shared cache', async () => {
    const cache = makeCache();
    const access = {
      getAccessMap: jest.fn().mockResolvedValue({ lesson: true }),
    };
    const lessons = {
      findAll: jest.fn().mockResolvedValue([{ id: 'lesson' }]),
    };
    const controller = new LessonsController(
      lessons as never,
      access as never,
      cache as never,
    );
    await controller.findAll('true', '1');
    expect(cache.getOrLoad).toHaveBeenCalledWith(
      PublicCatalogKeys.lessons(true, '1'),
      900000,
      expect.any(Function),
    );
    cache.getOrLoad.mockClear();
    await controller.getAccessMap();
    expect(cache.getOrLoad).not.toHaveBeenCalled();
    expect(access.getAccessMap).toHaveBeenCalledTimes(1);
    await controller.findAll(undefined, 'arbitrary-unknown-category');
    expect(cache.getOrLoad).not.toHaveBeenCalled();
  });
  it('registers and uses only public podcast/category list loaders', async () => {
    const cache = makeCache();
    const list = jest.fn().mockResolvedValue([]);
    const podcast = new PodcastCatalogController(
      { list } as never,
      cache as never,
    );
    await podcast.list();
    expect(list).toHaveBeenCalledWith();
    expect(cache.getOrLoad).toHaveBeenCalledWith(
      PublicCatalogKeys.podcasts,
      300000,
      expect.any(Function),
    );
    const categories = new CategoriesController(
      { findAll: list, findPopular: list } as never,
      cache as never,
    );
    await categories.findPopular();
    expect(cache.getOrLoad).toHaveBeenLastCalledWith(
      PublicCatalogKeys.popularCategories,
      900000,
      expect.any(Function),
    );
  });
  it('invalidates after a visibility mutation and still checks source access against the DB', async () => {
    const cache = makeCache();
    const prisma = {
      podcastVideo: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'video',
          title: 'Video',
          duration: 1,
          publishedAt: null,
          channel: { id: 'channel', name: 'Channel' },
        }),
        update: jest.fn().mockResolvedValue({ id: 'video', isVisible: false }),
      },
    };
    const catalog = new PodcastCatalogService(
      prisma as never,
      {} as never,
      cache as never,
    );
    await catalog.setVideoVisible('video', false);
    expect(cache.invalidate).toHaveBeenCalledWith(PublicCatalogKeys.podcasts);
    await catalog.findVideo('video');
    expect(prisma.podcastVideo.findFirst).toHaveBeenLastCalledWith({
      where: { id: 'video', isVisible: true, channel: { isVisible: true } },
      include: { channel: true },
    });
  });
  it('waits for an import transaction to commit before invalidating the catalog', async () => {
    const cache = makeCache();
    let finish!: (value: unknown) => void;
    const transaction = new Promise((resolve) => {
      finish = resolve;
    });
    const imports = new PodcastImportService(
      { $transaction: jest.fn().mockReturnValue(transaction) } as never,
      {} as never,
      cache as never,
    );
    const pending = imports.commit('job', ['video']);
    expect(cache.invalidate).not.toHaveBeenCalled();
    const result = { id: 'job', importedCount: 1 };
    finish(result);
    await expect(pending).resolves.toBe(result);
    expect(cache.invalidate).toHaveBeenCalledWith(PublicCatalogKeys.podcasts);
  });
  it('keeps the current catalog cache when an import transaction fails', async () => {
    const cache = makeCache();
    const imports = new PodcastImportService(
      {
        $transaction: jest
          .fn()
          .mockRejectedValue(new Error('Transaction rolled back')),
      } as never,
      {} as never,
      cache as never,
    );
    await expect(imports.commit('job', ['video'])).rejects.toThrow(
      'Transaction rolled back',
    );
    expect(cache.invalidate).not.toHaveBeenCalled();
  });
});
