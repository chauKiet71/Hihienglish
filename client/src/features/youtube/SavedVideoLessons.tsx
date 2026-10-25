import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { videoThumbnail, videoTime } from './catalog';
import {
  findPublicVideo,
  type PublicVideo,
} from '../../../../src/catalog/public-videos';

export default function SavedVideoLessons({
  videos,
}: {
  videos: Array<Pick<PublicVideo, 'id' | 'title' | 'duration'>>;
}) {
  return (
    <section aria-label="Video đã lưu" className="mt-3 grid grid-cols-2 gap-3">
      {videos.map((video) => {
        const entry = findPublicVideo(video.id);
        if (!entry) return null;
        return (
          <Link
            key={video.id}
            to={entry.lessonPath}
            className="overflow-hidden rounded-xl bg-white shadow-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary dark:bg-neutral-900"
          >
            <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-neutral-800">
              <img
                src={videoThumbnail(video.id)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary">
                  <Play size={14} fill="currentColor" />
                </span>
              </span>
            </div>
            <div className="p-2.5">
              <h3 className="line-clamp-2 text-xs font-semibold leading-4 text-gray-900 dark:text-white">
                {video.title}
              </h3>
              <p className="mt-1 text-[10px] text-slate-400">
                {entry.channelName} · {videoTime(video.duration)}
              </p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
