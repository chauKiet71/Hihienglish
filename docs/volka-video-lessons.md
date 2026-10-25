# Volka English video lessons

The homepage includes a two-card horizontal carousel of five videos, a channel page at `/kenh/volka-english`, and lessons at `/kenh/volka-english/video/:videoId`.

`src/catalog/volka-videos.ts` is the shared, curated catalogue, verified against the channel on 2026-10-25. Edit this list to change the selection. It does not automatically track new uploads. The channel page displays the five lessons directly below the channel header.

Lessons embed the original YouTube player. Selecting a subtitle seeks and plays that sentence. Playback highlights the current word and scrolls to the current sentence. Clicking a word pauses the video and opens the existing contextual vocabulary sheet, including pronunciation and related words.

The bottom toolbar provides speed, Vietnamese translation, save, repeat, and speaking practice. Saved videos use the existing Favorites provider with `youtube:<videoId>` IDs and appear under Explore → Đã lưu. Repeat restarts the whole video when it ends, matching the regular lesson. Speaking practice pauses playback, records the selected sentence through `useShadowing`, and displays the score, recognized speech, and correctly/incorrectly pronounced words on that sentence. Playback controls are disabled while recording or scoring; the stop-recording button remains available.

## Transcript preparation

- `POST /api/featured-videos/:id/transcript` starts preparation or returns an existing result.
- `GET /api/featured-videos/:id/transcript` reads progress without starting processing.
- Responses contain `status`, `segments`, and `errorMessage`. Only catalogue video IDs are accepted.
- Concurrent requests share one preparation. Results persist in `storage/featured-videos/:id/transcript-v2.json` and are reused after restarts.
- Preparation uses the existing `OPENAI_API_KEY`, yt-dlp, and transcription configuration. It prefers original English subtitle tracks and rejects translation tracks that collapse all text into the first few seconds. It falls back to the existing transcription pipeline if needed.
- Featured lessons do not create personal import jobs or consume the learner's daily import quota. Their translation cost is incurred once per cached video. Keep `storage/featured-videos` persistent on the server.
- On a fresh server, initial subtitle preparation may take several minutes. Video playback remains available while preparing or after subtitle failure. The learner can explicitly retry.

## Verification

```powershell
node node_modules/typescript/bin/tsc -p test/youtube/tsconfig.json --noEmit
node node_modules/typescript/bin/tsc -p tsconfig.build.json --noEmit --incremental false
node node_modules/jest/bin/jest.js --config test/youtube/jest.config.cjs --cacheDirectory node_modules/.cache/volka-client --runInBand
node node_modules/jest/bin/jest.js --cacheDirectory node_modules/.cache/volka-server --runInBand --runTestsByPath src/video-translate/featured-video.service.spec.ts src/video-translate/featured-video-captions.spec.ts src/video-translate/video-translate.service.spec.ts src/video-translate/video-translate.controller.spec.ts
```
