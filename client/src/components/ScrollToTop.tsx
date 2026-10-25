import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const previousPath = useRef<string | null>(null);

  useLayoutEffect(() => {
    const openingPodcastVideo = pathname === '/podcast' && previousPath.current === pathname;
    previousPath.current = pathname;
    if (openingPodcastVideo) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
}
