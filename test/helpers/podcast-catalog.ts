import { PODCAST_CHANNELS } from '../../src/catalog/podcast';
import { VOLKA_CHANNEL, VOLKA_VIDEOS } from '../../src/catalog/volka-videos';
import type { CatalogChannel } from '../../src/podcast/catalog.types';

export const catalogFixture: CatalogChannel[] = [
  {
    ...VOLKA_CHANNEL,
    id: 'volka-english',
    channelId: 'UCcvjK35lDPZTlkIrrwxpepg',
    description: '',
    videos: VOLKA_VIDEOS,
  },
  ...PODCAST_CHANNELS,
].map((channel) => ({
  ...channel,
  isVisible: true,
  lastSyncedAt: null,
  videos: channel.videos.map((video) => ({
    ...video,
    isVisible: true,
    transcriptStatus: 'PENDING',
    channelName: channel.name,
    channelId: channel.id,
    lessonPath:
      channel.id === 'volka-english'
        ? `/kenh/volka-english/video/${video.id}`
        : `/podcast?channel=${channel.id}&v=${video.id}`,
  })),
}));
