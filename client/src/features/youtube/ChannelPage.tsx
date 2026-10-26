import { Link } from 'react-router-dom';
import { ChevronLeft, ExternalLink, Youtube } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
import StickyPageHeader from '../../components/StickyPageHeader';
import { videoLessonPath, videoThumbnail, videoTime } from './catalog';
import {
  CatalogFeedback,
  usePodcastCatalog,
} from '../podcast/usePodcastCatalog';

export default function ChannelPage() {
  const catalog = usePodcastCatalog();
  const channel = catalog.channels.find((item) => item.id === 'volka-english');
  if (!channel)
    return (
      <main>
        <CatalogFeedback catalog={catalog} />
        {!catalog.loading && !catalog.error && (
          <p className="p-5 text-center">Kênh hiện chưa khả dụng.</p>
        )}
      </main>
    );
  const VOLKA_CHANNEL = channel;
  const VOLKA_VIDEOS = channel.videos;
  const nameCharacters = Array.from(VOLKA_CHANNEL.name);
  const channelTitle =
    nameCharacters.length > 30
      ? `${nameCharacters.slice(0, 29).join('').trimEnd()}…`
      : VOLKA_CHANNEL.name;

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#0b1115] dark:text-[#f4f4ef]">
      <div className="mx-auto max-w-lg px-5 pb-24">
        <StickyPageHeader className="-mx-5 px-5 pt-[max(16px,env(safe-area-inset-top))]">
          <header className="relative flex h-11 items-center justify-center px-11">
            <Link
              to="/"
              aria-label="Trở về trang chủ"
              className="absolute -left-2 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-teal-600 dark:hover:bg-white/10 dark:focus-visible:outline-teal-400"
            >
              <ChevronLeft size={28} />
            </Link>
            <h1
              className="truncate text-sm font-semibold"
              title={VOLKA_CHANNEL.name}
              aria-label={VOLKA_CHANNEL.name}
            >
              {channelTitle}
            </h1>
          </header>
        </StickyPageHeader>
        <header className="mb-8 mt-5 flex items-center gap-4">
          <img
            src={VOLKA_CHANNEL.avatarUrl}
            alt={VOLKA_CHANNEL.name}
            className="h-20 w-20 shrink-0 rounded-full bg-slate-200 object-cover dark:bg-slate-800"
          />
          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-[23px] font-bold tracking-tight sm:text-[28px]"
              title={VOLKA_CHANNEL.name}
              aria-label={VOLKA_CHANNEL.name}
            >
              {channelTitle}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-[#9dacb6]">
              <a
                href={VOLKA_CHANNEL.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-2 hover:border-teal-500 dark:border-[#28343d] dark:bg-[#111b23] dark:hover:border-teal-500"
              >
                <Youtube size={16} className="text-red-500" /> YouTube{' '}
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </header>
        <section
          id="channel-videos"
          aria-label="Danh sách bài nghe YouTube"
          className="space-y-5"
        >
          {VOLKA_VIDEOS.map((video) => (
            <Link
              key={video.id}
              to={videoLessonPath(video.id)}
              className="group flex items-start gap-3 rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
            >
              <div className="relative aspect-video w-[44%] shrink-0 overflow-hidden rounded-[14px] border border-slate-200 bg-slate-200 dark:border-[#28313a] dark:bg-[#17222b]">
                <img
                  src={videoThumbnail(video.id)}
                  alt=""
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute bottom-1.5 right-1.5 rounded-md border border-white/10 bg-black/85 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white">
                  {videoTime(video.duration)}
                </span>
              </div>
              <div className="min-w-0 py-0.5">
                <h2 className="line-clamp-2 text-[15px] font-semibold leading-[1.45] tracking-wide group-hover:text-teal-700 sm:text-lg dark:group-hover:text-[#50c5cb]">
                  {video.title}
                </h2>
                {video.publishedAt && (
                  <p className="mt-2 text-xs text-slate-500 sm:text-sm dark:text-[#8194a2]">
                    {new Intl.DateTimeFormat('vi-VN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      timeZone: 'UTC',
                    }).format(new Date(video.publishedAt))}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </section>
      </div>
      <BottomNav />
    </main>
  );
}
