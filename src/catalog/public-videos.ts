import { PODCAST_CHANNELS } from './podcast';
import { VOLKA_CHANNEL, VOLKA_VIDEOS } from './volka-videos';

export interface PublicVideo {
  id: string;
  title: string;
  duration: number;
  channelName: string;
  lessonPath: string;
}

export const PUBLIC_VIDEOS: PublicVideo[] = [
  ...VOLKA_VIDEOS.map((video) => ({
    ...video,
    channelName: VOLKA_CHANNEL.name,
    lessonPath: `/kenh/volka-english/video/${encodeURIComponent(video.id)}`,
  })),
  ...PODCAST_CHANNELS.flatMap((channel) =>
    channel.videos.map((video) => ({
      ...video,
      channelName: channel.name,
      lessonPath: `/podcast?channel=${encodeURIComponent(channel.id)}&v=${encodeURIComponent(video.id)}`,
    })),
  ),
];

export const findPublicVideo = (id: string) =>
  PUBLIC_VIDEOS.find((video) => video.id === id);
