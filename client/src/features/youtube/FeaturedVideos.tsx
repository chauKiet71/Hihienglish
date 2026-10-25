import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import HorizontalScroll from '../../components/HorizontalScroll';
import {
  CHANNEL_PATH,
  VOLKA_CHANNEL,
  VOLKA_VIDEOS,
  videoLessonPath,
  videoThumbnail,
  videoTime,
} from './catalog';

export default function FeaturedVideos() {
  return (
    <section className="mb-5 px-4" aria-labelledby="volka-videos-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id="volka-videos-title"
          className="font-bold text-gray-900 dark:text-white"
        >
          {VOLKA_CHANNEL.name}
        </h2>
        <Link
          to={CHANNEL_PATH}
          className="shrink-0 text-sm font-medium text-primary"
        >
          Xem tất cả
        </Link>
      </div>
      <HorizontalScroll
        className="pb-2"
        visibleItems={2}
        hideScrollbar
        startAtBeginning
      >
        <div className="flex gap-3">
          {VOLKA_VIDEOS.map((video) => (
            <Link
              key={video.id}
              to={videoLessonPath(video.id)}
              data-carousel-item
              draggable={false}
              aria-label={`Học qua video: ${video.title}`}
              className="group block shrink-0 overflow-hidden rounded-xl bg-white card-shadow outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary dark:bg-neutral-900"
              style={{ width: 'var(--carousel-item-width, 11rem)' }}
            >
              <div className="relative aspect-video overflow-hidden bg-slate-200 dark:bg-neutral-800">
                <img
                  src={videoThumbnail(video.id)}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="pointer-events-none h-full w-full select-none object-cover transition-transform group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-primary shadow-sm">
                    <Play size={14} fill="currentColor" className="ml-0.5" />
                  </span>
                </div>
              </div>
              <div className="p-2.5">
                <p className="line-clamp-2 min-h-8 text-xs font-semibold leading-4 text-gray-900 dark:text-white">
                  {video.title}
                </p>
                <p className="mt-1 text-[10px] text-gray-400">
                  {videoTime(video.duration)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </HorizontalScroll>
    </section>
  );
}
