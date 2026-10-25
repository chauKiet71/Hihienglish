"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPublicVideo = exports.PUBLIC_VIDEOS = void 0;
const podcast_1 = require("./podcast");
const volka_videos_1 = require("./volka-videos");
exports.PUBLIC_VIDEOS = [
    ...volka_videos_1.VOLKA_VIDEOS.map((video) => ({
        ...video,
        channelName: volka_videos_1.VOLKA_CHANNEL.name,
        lessonPath: `/kenh/volka-english/video/${encodeURIComponent(video.id)}`,
    })),
    ...podcast_1.PODCAST_CHANNELS.flatMap((channel) => channel.videos.map((video) => ({
        ...video,
        channelName: channel.name,
        lessonPath: `/podcast?channel=${encodeURIComponent(channel.id)}&v=${encodeURIComponent(video.id)}`,
    }))),
];
const findPublicVideo = (id) => exports.PUBLIC_VIDEOS.find((video) => video.id === id);
exports.findPublicVideo = findPublicVideo;
//# sourceMappingURL=public-videos.js.map