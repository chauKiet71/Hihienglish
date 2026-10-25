import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import StickyPageHeader from '../../components/StickyPageHeader';
import { ChevronLeft, ExternalLink, Youtube } from 'lucide-react';
import {
  podcastDuration,
  podcastVideoPath,
  type PodcastChannel,
} from './catalog';

export default function PodcastChannelList({
  channel,
}: {
  channel: PodcastChannel;
}) {
  const nameCharacters = Array.from(channel.name);
  const channelTitle =
    nameCharacters.length > 30
      ? `${nameCharacters.slice(0, 29).join('').trimEnd()}…`
      : channel.name;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [channel.id]);

  return (
    <main className="px-3 pb-6 text-gray-900 dark:text-white">
      <StickyPageHeader className="-mx-3 px-3 pb-5 pt-[max(16px,env(safe-area-inset-top))]">
        <header className="relative mx-2 flex h-11 items-center justify-center px-11 text-slate-900 dark:text-[#f4f4ef]">
          <Link
            to={`/podcast#${channel.id}`}
            aria-label="Trở về Podcast"
            className="absolute -left-2 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-teal-600 dark:hover:bg-white/10 dark:focus-visible:outline-teal-400"
          >
            <ChevronLeft size={28} />
          </Link>
          <h1
            className="truncate text-sm font-semibold"
            title={channel.name}
            aria-label={channel.name}
          >
            {channelTitle}
          </h1>
        </header>
      </StickyPageHeader>
      <div className="mb-7 flex items-center gap-3">
        <img
          src={channel.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="aspect-square w-1/5 min-w-16 max-w-20 shrink-0 rounded-full bg-gray-100 object-cover dark:bg-neutral-800"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-[23px] font-bold leading-tight tracking-tight">
            {channel.name}
          </h2>
          <a
            href={channel.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <Youtube size={16} className="text-red-500" />
            YouTube
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
      <section
        aria-label={`Danh sách video của ${channel.name}`}
        className="space-y-5"
      >
        {channel.videos.map((video) => (
          <Link
            key={video.id}
            to={podcastVideoPath(video.id, channel.id)}
            data-podcast-list-video
            aria-label={`Phát: ${video.title}`}
            className="group flex items-start gap-3 rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className="relative aspect-video w-[44%] shrink-0 overflow-hidden rounded-[14px] border border-gray-200 bg-gray-200 dark:border-neutral-700 dark:bg-neutral-800">
              <img
                src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover motion-safe:transition-transform motion-safe:group-hover:scale-105"
              />
              <span className="absolute bottom-1.5 right-1.5 rounded-md border border-white/10 bg-black/85 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white">
                {podcastDuration(video.duration)}
              </span>
            </div>
            <h2 className="line-clamp-2 min-w-0 py-0.5 text-sm font-semibold leading-5 tracking-wide group-hover:text-primary">
              {video.title}
            </h2>
          </Link>
        ))}
      </section>
    </main>
  );
}
