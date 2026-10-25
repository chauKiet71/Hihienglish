export {
  VOLKA_CHANNEL,
  VOLKA_VIDEOS,
  type VolkaVideo,
} from '../../../../src/catalog/volka-videos';

export const CHANNEL_PATH = '/kenh/volka-english';
export const videoFavoriteId = (id: string) => `youtube:${id}`;
export const videoLessonPath = (id: string) => `${CHANNEL_PATH}/video/${id}`;
export const videoThumbnail = (id: string) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export function videoTime(seconds: number) {
  const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
