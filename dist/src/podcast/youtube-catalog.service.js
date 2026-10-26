"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeCatalogService = void 0;
exports.youtubeDuration = youtubeDuration;
exports.channelFilter = channelFilter;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const youtube_util_1 = require("../video-translate/youtube.util");
function youtubeDuration(value) {
    const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value);
    if (!match)
        return 0;
    return Math.floor(Number(match[1] || 0) * 86400 +
        Number(match[2] || 0) * 3600 +
        Number(match[3] || 0) * 60 +
        Number(match[4] || 0));
}
function channelFilter(input) {
    const value = input.trim();
    if (/^UC[\w-]{22}$/.test(value))
        return { id: value };
    if (/^@[\p{L}\p{N}_.-]{1,100}$/u.test(value))
        return { forHandle: value };
    let url;
    try {
        url = new URL(value);
    }
    catch {
        throw new common_1.BadRequestException('Nhập URL kênh YouTube, @handle hoặc mã kênh UC.');
    }
    if (url.protocol !== 'https:' ||
        !['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname) ||
        url.username ||
        url.password ||
        url.port)
        throw new common_1.BadRequestException('Chỉ chấp nhận địa chỉ kênh trên youtube.com.');
    let path;
    try {
        path = decodeURIComponent(url.pathname).split('/').filter(Boolean);
    }
    catch {
        throw new common_1.BadRequestException('URL kênh không hợp lệ.');
    }
    if (path[0]?.startsWith('@'))
        return channelFilter(path[0]);
    if (path[0] === 'channel' && /^UC[\w-]{22}$/.test(path[1] || ''))
        return { id: path[1] };
    if (path[0] === 'user' && /^[\w.-]{1,100}$/.test(path[1] || ''))
        return { forUsername: path[1] };
    throw new common_1.BadRequestException('Hãy dùng URL dạng youtube.com/@tenkenh hoặc /channel/UC…');
}
let YoutubeCatalogService = class YoutubeCatalogService {
    config;
    constructor(config) {
        this.config = config;
    }
    get configured() {
        return !!this.config.get('YOUTUBE_DATA_API_KEY')?.trim();
    }
    async request(resource, params) {
        const key = this.config.get('YOUTUBE_DATA_API_KEY')?.trim();
        if (!key)
            throw new common_1.ServiceUnavailableException('Chưa cấu hình kết nối YouTube. Quản trị hệ thống cần đặt YOUTUBE_DATA_API_KEY trên máy chủ.');
        const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
        url.search = new URLSearchParams({ ...params, key }).toString();
        let response;
        try {
            response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
        }
        catch {
            throw new common_1.ServiceUnavailableException('Không kết nối được YouTube. Hãy thử lại sau.');
        }
        if (!response.ok)
            throw new common_1.ServiceUnavailableException(response.status === 403 || response.status === 429
                ? 'YouTube từ chối yêu cầu. Hãy kiểm tra khóa API, quyền YouTube Data API và hạn mức sử dụng.'
                : 'YouTube chưa trả được dữ liệu. Hãy thử lại sau.');
        return response.json();
    }
    async channel(input) {
        const response = await this.request('channels', {
            part: 'snippet,contentDetails',
            ...channelFilter(input),
        });
        const item = response.items[0];
        if (!item)
            throw new common_1.NotFoundException('Không tìm thấy kênh YouTube này.');
        return {
            youtubeChannelId: item.id,
            handle: item.snippet.customUrl || item.id,
            name: item.snippet.title,
            description: item.snippet.description || '',
            url: `https://www.youtube.com/channel/${item.id}`,
            avatarUrl: item.snippet.thumbnails?.medium?.url ||
                item.snippet.thumbnails?.default?.url ||
                '',
            uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
        };
    }
    async videos(ids) {
        if (!ids.length)
            return [];
        const response = await this.request('videos', {
            part: 'snippet,contentDetails,status',
            id: ids.join(','),
        });
        const byId = new Map(response.items.map((item) => [item.id, item]));
        return ids.flatMap((id) => {
            const item = byId.get(id);
            if (!item ||
                !item.status.embeddable ||
                item.status.privacyStatus !== 'public' ||
                (item.snippet.liveBroadcastContent &&
                    item.snippet.liveBroadcastContent !== 'none'))
                return [];
            const duration = youtubeDuration(item.contentDetails.duration);
            if (!duration || duration > 86400)
                return [];
            return [
                {
                    id,
                    title: item.snippet.title,
                    duration,
                    publishedAt: item.snippet.publishedAt,
                    youtubeChannelId: item.snippet.channelId,
                },
            ];
        });
    }
    async page(playlistId, pageToken) {
        const response = await this.request('playlistItems', {
            part: 'contentDetails',
            playlistId,
            maxResults: '50',
            ...(pageToken ? { pageToken } : {}),
        });
        return {
            ids: response.items.map((item) => item.contentDetails.videoId),
            nextPageToken: response.nextPageToken,
        };
    }
    async video(url) {
        const id = (0, youtube_util_1.extractYoutubeVideoId)(url);
        if (!id)
            throw new common_1.BadRequestException('URL video YouTube không hợp lệ.');
        const [video] = await this.videos([id]);
        if (!video)
            throw new common_1.BadRequestException('Video phải công khai, cho phép phát nhúng và không đang phát trực tiếp.');
        return video;
    }
};
exports.YoutubeCatalogService = YoutubeCatalogService;
exports.YoutubeCatalogService = YoutubeCatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], YoutubeCatalogService);
//# sourceMappingURL=youtube-catalog.service.js.map