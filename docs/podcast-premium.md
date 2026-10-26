# Podcast Premium preview

Open **Admin → Nội dung → Podcast** (`/admin/content/podcasts`). Each video has
a Premium switch and a preview duration in seconds. For example, enable Premium,
enter `120` and save: Free users and guests can listen until `02:00`, then playback
stops and the Premium dialog opens. `0` requires Premium immediately. Existing
videos remain open until an admin explicitly enables Premium.

The page covers all videos in the shared catalog, including Volka English. It
supports channel/search/status filters, input validation, per-video saves and
retrying failed saves without losing the draft.

## Playback and authorization

- Playback waits for the server's access response. A failed access check stops
  playback and offers retry. Guest, Free and expired subscriptions receive the
  preview limit, including administrators on a Free or expired plan. Only an
  active Premium subscription grants full listening access; admin permissions
  grant configuration access separately.
- The same player enforces the limit for catalog links, timestamps, vocabulary
  replay links, timeline seeking, YouTube state changes and repeat mode. Opening
  an imported copy of a catalog video redirects to its catalog player.
- At the limit, playback pauses, time is clamped to the boundary, and the upgrade
  dialog receives keyboard focus. Its description is “Nâng cấp Premium để nghe
  tiếp toàn bộ podcast.” For a positive preview duration, both the X button and
  “Nghe lại” close the dialog, clear any sentence replay endpoint, seek to zero
  and automatically play again. The configured preview limit still applies.
  A zero-length preview continues to require Premium before any playback.
- Access is checked again on focus, visibility changes, local policy updates,
  every 30 seconds, and at the subscription expiry time. Expiry/unavailable access
  destroys the existing player before a new entitlement is accepted.
- Transcript APIs filter out segments crossing or following the preview limit.
  Responses are private/no-store and never modify the shared full transcript.
  Generated podcast storage is not served directly through `/media`.
- Settings are public read-only metadata. Only authenticated admins can update
  them; the server validates the id against the catalog and requires an integer
  preview from zero to less than the video duration.

The source videos are public YouTube embeds. This enforces the product's preview
inside HiHiEnglish, including its transcript API; it does not make the original
YouTube upload private or provide DRM. The native stop parameter supplements the
application's playback/seek checks: [YouTube player parameters](https://developers.google.com/youtube/player_parameters#end).

## Database and validation

`PodcastAccess` maps to `podcast_access`. The additive SQL is
`prisma/updates/20261026_podcast_access.sql`. It was applied to the configured
database without changing any video's Premium setting. Prisma Client
was regenerated. New environments must apply the SQL or the normal schema sync
before using these endpoints.

- Backend: `npx jest --runInBand --testPathPatterns podcast-access --cacheDirectory node_modules/.cache/jest-server-podcast`
- Player/admin: `npm run test:podcast-premium`
- Scoped frontend types: `npx tsc -p test/podcast-premium/tsconfig.json --noEmit`
- Existing Podcast, YouTube, prefetch and video import regressions remain covered
  by their respective test commands.
