-- Additive UP migration. Existing Premium policies, histories and vocabulary stay intact.
BEGIN;
CREATE TABLE IF NOT EXISTS podcast_channels (
  id TEXT PRIMARY KEY, youtube_channel_id TEXT NOT NULL UNIQUE,
  handle TEXT NOT NULL, name TEXT NOT NULL, url TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '', avatar_url TEXT NOT NULL,
  uploads_playlist_id TEXT, is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0, last_synced_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS podcast_videos (
  id TEXT PRIMARY KEY, channel_id TEXT NOT NULL REFERENCES podcast_channels(id) ON DELETE RESTRICT,
  title TEXT NOT NULL, duration INTEGER NOT NULL CHECK (duration > 0),
  published_at TIMESTAMP(3), is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0, transcript_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS podcast_videos_channel_id_sort_order_idx ON podcast_videos(channel_id, sort_order);
CREATE TABLE IF NOT EXISTS podcast_import_jobs (
  id TEXT PRIMARY KEY, channel_id TEXT NOT NULL REFERENCES podcast_channels(id) ON DELETE RESTRICT,
  mode TEXT NOT NULL, requested_count INTEGER NOT NULL,
  video_url TEXT, status TEXT NOT NULL DEFAULT 'QUEUED', scanned_count INTEGER NOT NULL DEFAULT 0,
  candidates_json JSONB NOT NULL DEFAULT '[]', imported_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT, lease_token TEXT, lease_until TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS podcast_import_jobs_status_lease_until_idx ON podcast_import_jobs(status, lease_until);
CREATE INDEX IF NOT EXISTS podcast_import_jobs_channel_id_created_at_idx ON podcast_import_jobs(channel_id, created_at);
COMMIT;
-- Rollback: roll the app back while retaining these additive tables and imported data.
-- Do not drop populated tables. The static seed is backfilled separately by CatalogService.
