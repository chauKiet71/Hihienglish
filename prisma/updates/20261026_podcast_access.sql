-- Additive change: existing podcasts stay open until an admin enables Premium.
CREATE TABLE IF NOT EXISTS "podcast_access" (
  "video_id" TEXT PRIMARY KEY,
  "is_premium" BOOLEAN NOT NULL DEFAULT false,
  "preview_seconds" INTEGER NOT NULL DEFAULT 120 CHECK ("preview_seconds" >= 0),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
