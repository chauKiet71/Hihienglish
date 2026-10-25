import { useId } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Play } from 'lucide-react';
import HorizontalScroll from '../../components/HorizontalScroll';
import {
  podcastDuration,
  podcastChannelPath,
  podcastVideoPath,
  type PodcastChannel,
} from './catalog';

export default function PodcastChannelRow({
  channel,
}: {
  channel: PodcastChannel;
}) {
  const rowId = useId();

  return (
    <section
      id={channel.id}
      aria-labelledby={`${rowId}-title`}
      className="scroll-mt-5"
    >
      <div className="mb-3 flex items-center gap-2.5 px-4">
        <img
          src={channel.avatarUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-9 w-9 shrink-0 rounded-full border border-gray-200 bg-white object-cover dark:border-neutral-700"
        />
        <div className="min-w-0 flex-1">
          <h2
            id={`${rowId}-title`}
            className="text-sm font-bold leading-5 text-gray-900 dark:text-white"
          >
            <a
              href={channel.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 rounded focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="min-w-0">{channel.name}</span>
              <ExternalLink size={12} className="shrink-0 text-gray-400" />
            </a>
          </h2>
        </div>
        <Link
          to={podcastChannelPath(channel.id)}
          aria-label={`Xem tất cả video của ${channel.name}`}
          className="inline-flex min-h-11 shrink-0 items-center text-xs font-semibold text-primary hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-primary dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          Xem tất cả
        </Link>
      </div>
      <HorizontalScroll
        id={rowId}
        role="region"
        aria-label={`Video của ${channel.name}`}
        tabIndex={0}
        visibleItems={2}
        hideScrollbar
        startAtBeginning
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            const row = event.currentTarget;
            const card = row.querySelector<HTMLElement>('[data-carousel-item]');
            row.scrollBy({
              left:
                (event.key === 'ArrowLeft' ? -1 : 1) *
                ((card?.offsetWidth ?? 280) + 12),
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches
                ? 'instant'
                : 'smooth',
            });
          }
        }}
        className="mx-4 pb-3 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <div className="flex gap-3">
          {channel.videos.map((video) => (
            <Link
              key={video.id}
              to={podcastVideoPath(video.id)}
              data-podcast-video
              data-carousel-item
              draggable={false}
              aria-label={`Phát: ${video.title}`}
              className="card-shadow group flex shrink-0 flex-col overflow-hidden rounded-xl bg-white text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-neutral-900"
              style={{ width: 'var(--carousel-item-width, 11rem)' }}
            >
              <div className="relative aspect-video overflow-hidden bg-gray-200 dark:bg-neutral-800">
                <img
                  src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="pointer-events-none h-full w-full select-none object-cover motion-safe:transition-transform motion-safe:group-hover:scale-105"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/15">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-primary shadow-sm">
                    <Play size={14} fill="currentColor" className="ml-0.5" />
                  </span>
                </span>
              </div>
              <div className="p-2.5">
                <h3 className="line-clamp-2 min-h-8 text-xs font-semibold leading-4 text-gray-900 group-hover:text-primary dark:text-white">
                  {video.title}
                </h3>
                <p className="mt-1 text-[10px] tabular-nums text-gray-400 dark:text-neutral-400">
                  {podcastDuration(video.duration)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </HorizontalScroll>
    </section>
  );
}
