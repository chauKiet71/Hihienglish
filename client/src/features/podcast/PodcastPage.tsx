import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import MobileLayout from '../../components/MobileLayout';
import StickyPageHeader from '../../components/StickyPageHeader';
import { podcastChannelPath } from './catalog';
import { CatalogFeedback, usePodcastCatalog } from './usePodcastCatalog';
import PodcastChannelRow from './PodcastChannelRow';
import PodcastChannelList from './PodcastChannelList';
import { VideoLesson } from '../youtube/VideoLessonPage';

export default function PodcastPage() {
  const catalog = usePodcastCatalog();
  const PODCAST_CHANNELS = catalog.channels;
  const [searchParams] = useSearchParams();
  const { hash } = useLocation();
  const requestedChannelId = searchParams.get('channel');
  const selectedChannel = PODCAST_CHANNELS.find(
    (item) => item.id === requestedChannelId,
  );
  useEffect(() => {
    const channelId = hash.slice(1);
    if (
      selectedChannel ||
      !PODCAST_CHANNELS.some((item) => item.id === channelId)
    )
      return;
    const frame = window.requestAnimationFrame(() =>
      document.getElementById(channelId)?.scrollIntoView({ block: 'start' }),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [hash, selectedChannel, PODCAST_CHANNELS]);
  const videoId = searchParams.get('v');
  const channel = requestedChannelId
    ? selectedChannel
    : PODCAST_CHANNELS.find((item) =>
        item.videos.some((video) => video.id === videoId),
      );
  const video = channel?.videos.find((item) => item.id === videoId);
  const notice =
    requestedChannelId && !selectedChannel
      ? 'Không tìm thấy kênh Podcast này. Hãy chọn một kênh bên dưới.'
      : videoId && !video
        ? 'Video này không có trong danh sách. Hãy chọn một video bên dưới.'
        : null;

  if (catalog.loading || (catalog.error && !PODCAST_CHANNELS.length))
    return (
      <MobileLayout>
        <CatalogFeedback catalog={catalog} />
      </MobileLayout>
    );
  if (video && channel)
    return (
      <VideoLesson
        key={video.id}
        video={video}
        backTo={
          selectedChannel
            ? podcastChannelPath(channel.id)
            : `/podcast#${channel.id}`
        }
        backLabel={`Trở về kênh ${channel.name}`}
      />
    );

  return (
    <MobileLayout>
      <CatalogFeedback catalog={catalog} />
      {notice && (
        <p
          role="status"
          className="mx-4 mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {notice}
        </p>
      )}
      {selectedChannel ? (
        <PodcastChannelList channel={selectedChannel} />
      ) : (
        <main className="pb-3">
          <StickyPageHeader className="pb-5 pt-[max(16px,env(safe-area-inset-top))]">
            <header className="relative mx-5 flex h-11 items-center justify-center px-11 text-slate-900 dark:text-[#f4f4ef]">
              <Link
                to="/"
                aria-label="Trở về trang chủ"
                className="absolute -left-2 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-teal-600 dark:hover:bg-white/10 dark:focus-visible:outline-teal-400"
              >
                <ChevronLeft size={28} />
              </Link>
              <h1 className="truncate text-sm font-semibold">Podcast</h1>
            </header>
          </StickyPageHeader>
          <div className="space-y-7">
            {PODCAST_CHANNELS.map((item) => (
              <PodcastChannelRow key={item.id} channel={item} />
            ))}
          </div>
        </main>
      )}
    </MobileLayout>
  );
}
