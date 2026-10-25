import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { prefetchAppFeatures } from '../lib/prefetchFeatures';

/** Start reads in the background; rendering/navigation never waits for them. */
export default function AppDataPrefetch() {
  const { user, loading } = useAuth();
  useEffect(() => {
    void prefetchAppFeatures(false, false);
  }, []);
  useEffect(() => {
    if (!loading) void prefetchAppFeatures(!!user);
  }, [loading, user?.id]);
  return null;
}
