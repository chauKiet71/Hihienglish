# Podcast

The public `/podcast` page replaces the speaking entry in navigation, home, and profile.
Old `/luyen-noi/*` URLs and `/postcast` redirect to `/podcast`.

Each channel's **Xem tất cả** link opens `/podcast?channel=<channel-id>` with
all 20 videos in a vertical list. The list includes the channel avatar and
YouTube link, video thumbnails, titles, and duration badges. Publication dates
are not currently included in the bundled catalog.
The list's top header shows the YouTube channel name, capped at 30 Unicode
characters including an ellipsis. The full name remains in its tooltip and
accessible label. Its back arrow returns to that channel's carousel.

Video carousels share the `HorizontalScroll` component used by Volka English,
including its two-card sizing and free horizontal scrolling. Hovering a carousel
and turning the mouse wheel moves it continuously by the wheel distance, so it
can stop between cards. At the beginning/end, outward wheel input scrolls the page normally.
Horizontal trackpad gestures, browser zoom, and arrow-key navigation remain
available; transitions respect the reduced-motion preference.

Opening a video from this list adds `v=<video-id>` while preserving the channel.
The lesson's back link returns to the same list. **Trở về Podcast** returns to that
channel's carousel. Unknown channel IDs fall back to the catalog with a notice;
videos outside a selected channel do not open a lesson.

Clicking a card opens the full learning screen shared with the Volka lessons:
YouTube player, timeline and playback controls, synchronized bilingual transcript,
word lookup and contextual vocabulary saving, speed, translation, lesson saving,
repeat, and Shadowing. Cards opened from a carousel return to that channel's
carousel. Saved public video lessons appear in Explore with their original channel
and reopen the matching lesson.

Transcript preparation uses the existing featured-video API and provider settings.
Only the selected video is prepared; subsequent opens reuse its cached transcript.
The first preparation can take several minutes. Loading, retry, and unavailable
video states use the same behavior as the existing lesson screen. Public video
IDs are validated against the shared catalog before transcript processing or
vocabulary source resolution.

Each of the seven configured YouTube channels has 20 published videos in
`src/catalog/podcast-channels.json`, shared by the client and server.
`src/catalog/public-videos.ts` combines these videos with the Volka catalog.
Metadata is bundled with the app,
so opening the page does not require an API key or a live catalog request.
Videos play using YouTube embeds, with a direct YouTube link available if embedding is restricted.
The catalog does not refresh automatically.

To refresh the video lists and channel avatars, run:

```sh
npm run sync:podcasts
npm run build:client
```

The refresh uses the project's `tools/yt-dlp` binary (or `yt-dlp` on PATH).
It fetches metadata only, validates 20 unique published videos per channel,
and writes the catalog only after all seven channels succeed.
Channel handles and descriptions are configured in `scripts/sync-podcasts.mjs`.
