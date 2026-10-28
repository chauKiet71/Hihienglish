import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { prefetchAppFeatures } from '../lib/prefetchFeatures';
import { scheduleBackgroundPrefetch } from '../lib/startupPrefetch';

/** Start reads in the background; rendering/navigation never waits for them. */
export default function AppDataPrefetch() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => {
    const critical = prefetchAppFeatures(!!user, !loading, {
      pathname,
      critical: true,
    });
    return scheduleBackgroundPrefetch(critical, () => {
      void prefetchAppFeatures(!!user, !loading);
    });
  }, [pathname, loading, user?.id]);
  return null;
}
