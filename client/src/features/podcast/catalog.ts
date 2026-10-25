export {
  PODCAST_CHANNELS,
  type PodcastChannel,
  type PodcastVideo,
} from '../../../../src/catalog/podcast';

export function podcastChannelPath(channelId: string) {
  return `/podcast?channel=${encodeURIComponent(channelId)}`;
}

export function podcastVideoPath(videoId: string, channelId?: string) {
  const videoQuery = `v=${encodeURIComponent(videoId)}`;
  return channelId
    ? `${podcastChannelPath(channelId)}&${videoQuery}`
    : `/podcast?${videoQuery}`;
}

export function podcastDuration(seconds: number) {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return `${hours ? `${hours}:${String(minutes).padStart(2, '0')}` : minutes}:${String(total % 60).padStart(2, '0')}`;
}
