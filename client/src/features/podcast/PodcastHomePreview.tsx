import { Link } from 'react-router-dom';
import HorizontalScroll from '../../components/HorizontalScroll';
import { CatalogFeedback, usePodcastCatalog } from './usePodcastCatalog';

export default function PodcastHomePreview() {
  const catalog = usePodcastCatalog();
  const PODCAST_CHANNELS = catalog.channels.filter(
    (channel) => channel.id !== 'volka-english',
  );
  return (
    <section className="mb-6 px-4" aria-label="Podcast">
      <CatalogFeedback catalog={catalog} />
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 dark:text-white">Podcast</h2>
        <Link
          to="/podcast"
          className="text-xs font-semibold text-primary dark:text-indigo-400"
        >
          Xem tất cả
        </Link>
      </div>
      <HorizontalScroll
        className="-mx-4 px-4 pb-3"
        hideScrollbar
        startAtBeginning
      >
        <div className="flex gap-3">
          {PODCAST_CHANNELS.map((channel) => (
            <Link
              key={channel.id}
              to={`/podcast#${channel.id}`}
              data-carousel-item
              draggable={false}
              className="group flex w-[152px] shrink-0 flex-col rounded-[18px] border border-gray-200/80 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <img
                src={channel.avatarUrl}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                draggable={false}
                className="mx-auto mb-3 h-20 w-20 rounded-full bg-gray-100 object-cover dark:bg-neutral-800"
              />
              <h3 className="line-clamp-2 min-h-8 text-xs font-bold leading-4 text-gray-900 group-hover:text-primary dark:text-white">
                {channel.name}
              </h3>
            </Link>
          ))}
        </div>
      </HorizontalScroll>
    </section>
  );
}
