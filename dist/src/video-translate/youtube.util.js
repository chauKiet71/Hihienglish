"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractYoutubeVideoId = extractYoutubeVideoId;
exports.youtubeWatchUrl = youtubeWatchUrl;
exports.youtubeThumbnailUrl = youtubeThumbnailUrl;
const YOUTUBE_VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
function validVideoId(value) {
    return value && YOUTUBE_VIDEO_ID_RE.test(value) ? value : null;
}
function extractYoutubeVideoId(input) {
    const trimmed = input.trim();
    if (YOUTUBE_VIDEO_ID_RE.test(trimmed))
        return trimmed;
    try {
        const url = new URL(trimmed);
        const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (hostname === 'youtu.be') {
            return validVideoId(pathParts[0]);
        }
        const isYoutubeHost = hostname === 'youtube.com' || hostname.endsWith('.youtube.com');
        if (!isYoutubeHost)
            return null;
        const watchId = validVideoId(url.searchParams.get('v'));
        if (watchId)
            return watchId;
        if (['embed', 'shorts', 'live'].includes(pathParts[0])) {
            return validVideoId(pathParts[1]);
        }
    }
    catch {
        return null;
    }
    return null;
}
function youtubeWatchUrl(videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
}
function youtubeThumbnailUrl(videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
//# sourceMappingURL=youtube.util.js.map