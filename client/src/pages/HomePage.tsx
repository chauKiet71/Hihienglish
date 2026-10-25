import SavedVocabularyHome from '../features/vocabulary/SavedVocabularyHome';
import { Link } from 'react-router-dom';
import { Play, User } from 'lucide-react';
import MobileLayout from '../components/MobileLayout';
import StickyPageHeader from '../components/StickyPageHeader';
import Logo from '../components/Logo';
import HorizontalScroll from '../components/HorizontalScroll';
import UserAvatar from '../components/UserAvatar';
import LessonLink from '../components/LessonLink';
import HeroBannerSlider from '../components/HeroBannerSlider';
import FeaturedVideos from '../features/youtube/FeaturedVideos';
import PodcastHomePreview from '../features/podcast/PodcastHomePreview';
import { useAuth } from '../contexts/AuthContext';
import { featuredLessons, formatDuration } from '../data/mockData';

import AddVideoButton from '../features/video/AddVideoButton';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <MobileLayout>
      {/* Header */}
      <StickyPageHeader>
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <Link to="/" className="inline-flex">
            <Logo size="sm" />
          </Link>
          {isAuthenticated ? (
            <Link to="/ca-nhan" className="rounded-full">
              <UserAvatar
                name={user?.fullName ?? 'User'}
                src={user?.avatarUrl}
                size="sm"
              />
            </Link>
          ) : (
            <Link
              to="/dang-nhap"
              className="flex items-center gap-1 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5"
            >
              <User size={14} />
              Đăng nhập
            </Link>
          )}
        </div>
      </StickyPageHeader>

      {/* Hero */}
      <div className="px-4 py-4">
        <HeroBannerSlider />
      </div>

      {/* Featured Lessons */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Bài nghe nổi bật</h2>
          <Link
            to="/kham-pha?filter=featured"
            className="text-sm text-primary font-medium"
          >
            Xem tất cả
          </Link>
        </div>
        <HorizontalScroll
          className="pb-2"
          visibleItems={2}
          autoPlay
          autoPlayInterval={3000}
          hideScrollbar
        >
          <div className="flex gap-3">
            {featuredLessons.map((lesson) => (
              <LessonLink
                key={lesson.id}
                lessonId={lesson.id}
                data-carousel-item
                draggable={false}
                className="flex-shrink-0 rounded-xl overflow-hidden card-shadow bg-white block"
                style={{ width: 'var(--carousel-item-width, 11rem)' }}
              >
                <div className="relative h-24">
                  <img
                    src={lesson.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                      <Play
                        size={14}
                        className="text-primary ml-0.5"
                        fill="currentColor"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">
                    {lesson.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {formatDuration(lesson.duration)}
                  </p>
                </div>
              </LessonLink>
            ))}
          </div>
        </HorizontalScroll>
      </div>

      <FeaturedVideos />

      <SavedVocabularyHome />

      <PodcastHomePreview />

      <AddVideoButton />
    </MobileLayout>
  );
}
