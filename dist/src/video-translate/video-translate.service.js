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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var VideoTranslateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoTranslateService = exports.DUBBED_PIPELINE_VERSION = exports.DEFAULT_MAX_SECONDS_PREMIUM = exports.DEFAULT_MAX_SECONDS_FREE = exports.FREE_VIDEO_TRANSLATE_PER_DAY = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const openai_1 = __importDefault(require("openai"));
const youtube_transcript_1 = require("youtube-transcript");
const prisma_service_1 = require("../prisma/prisma.service");
const featured_video_captions_1 = require("./featured-video-captions");
const youtube_util_1 = require("./youtube.util");
exports.FREE_VIDEO_TRANSLATE_PER_DAY = 3;
exports.DEFAULT_MAX_SECONDS_FREE = 600;
exports.DEFAULT_MAX_SECONDS_PREMIUM = 1200;
const DEFAULT_TRANSLATION_BATCH_SIZE = 24;
const DEFAULT_TRANSLATION_CONCURRENCY = 3;
exports.DUBBED_PIPELINE_VERSION = 13;
const TRANSCRIPT_RULES = {
    pauseBreakSec: 0.5,
    timestampEpsilonSec: 0.001,
};
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
let VideoTranslateService = VideoTranslateService_1 = class VideoTranslateService {
    prisma;
    config;
    logger = new common_1.Logger(VideoTranslateService_1.name);
    openai = null;
    processing = new Set();
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        const apiKey = this.config.get('OPENAI_API_KEY');
        if (apiKey) {
            this.openai = new openai_1.default({ apiKey });
        }
        else {
            this.logger.warn('OPENAI_API_KEY chưa cấu hình — dịch video sẽ không chạy được');
        }
    }
    async getQuota(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { isPremium: true, premiumExpiresAt: true },
        });
        const isPremium = this.resolvePremium(user);
        const usage = await this.getTodayUsage(userId);
        return {
            used: usage,
            limit: exports.FREE_VIDEO_TRANSLATE_PER_DAY,
            remaining: isPremium
                ? null
                : Math.max(0, exports.FREE_VIDEO_TRANSLATE_PER_DAY - usage),
            isPremium,
            resetsAt: this.nextResetAt().toISOString(),
            maxSeconds: isPremium ? this.maxSecondsPremium() : this.maxSecondsFree(),
        };
    }
    async listJobs(userId) {
        const jobs = await this.prisma.videoTranslateJob.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        const repairedJobs = await Promise.all(jobs.map((job) => this.repairLegacyYoutubeDuration(job)));
        return {
            jobs: repairedJobs.map((job) => this.serializeJob(job)),
            quota: await this.getQuota(userId),
        };
    }
    async getJob(userId, jobId) {
        const job = await this.prisma.videoTranslateJob.findFirst({
            where: { id: jobId, userId },
        });
        if (!job)
            throw new common_1.NotFoundException('Không tìm thấy job dịch video');
        return {
            job: this.serializeJob(job),
            quota: await this.getQuota(userId),
        };
    }
    async deleteJob(userId, jobId) {
        const job = await this.prisma.videoTranslateJob.findFirst({
            where: { id: jobId, userId },
            select: { id: true },
        });
        if (!job)
            throw new common_1.NotFoundException('Không tìm thấy job dịch video');
        await this.prisma.videoTranslateJob.delete({
            where: { id: job.id },
        });
        try {
            (0, fs_1.rmSync)((0, path_1.join)(process.cwd(), 'storage', 'video-translate', job.id), {
                recursive: true,
                force: true,
            });
        }
        catch {
        }
        return { deleted: true };
    }
    async resolveDubbedFilePath(userId, jobId) {
        const job = await this.prisma.videoTranslateJob.findFirst({
            where: { id: jobId, userId },
            select: { dubbedAudioUrl: true, status: true },
        });
        if (!job ||
            job.status !== client_1.VideoTranslateStatus.READY ||
            !job.dubbedAudioUrl) {
            return null;
        }
        const match = job.dubbedAudioUrl.match(/^\/media\/video-translate\/([^/]+)\/dubbed\.mp3$/);
        const folderId = match?.[1] ?? jobId;
        const filePath = (0, path_1.join)(process.cwd(), 'storage', 'video-translate', folderId, 'dubbed.mp3');
        return (0, fs_1.existsSync)(filePath) ? filePath : null;
    }
    async createJobFromUpload(userId, file) {
        this.ensureOpenAi();
        const originalName = String(file.originalname || 'video').trim() || 'video';
        const ext = this.resolveUploadExtension(originalName, file.mimetype);
        if (!ext) {
            throw new common_1.BadRequestException('Định dạng không hỗ trợ. Hãy dùng mp4, webm, mov, mkv, mp3, m4a hoặc wav.');
        }
        if (!file.buffer?.length) {
            throw new common_1.BadRequestException('File tải lên rỗng');
        }
        if (file.buffer.length > 120 * 1024 * 1024) {
            throw new common_1.BadRequestException('File tối đa 120MB');
        }
        await this.assertAndReserveQuota(userId);
        const title = this.titleFromFilename(originalName);
        let job;
        try {
            job = await this.prisma.videoTranslateJob.create({
                data: {
                    userId,
                    youtubeVideoId: null,
                    youtubeUrl: null,
                    originalFilename: originalName.slice(0, 240),
                    title,
                    status: client_1.VideoTranslateStatus.PENDING,
                    pipelineVersion: exports.DUBBED_PIPELINE_VERSION,
                },
            });
        }
        catch (error) {
            await this.releaseQuotaReservation(userId);
            throw error;
        }
        const jobDir = (0, path_1.join)(process.cwd(), 'storage', 'video-translate', job.id);
        (0, fs_1.mkdirSync)(jobDir, { recursive: true });
        const sourceName = `source.${ext}`;
        const sourcePath = (0, path_1.join)(jobDir, sourceName);
        (0, fs_1.writeFileSync)(sourcePath, file.buffer);
        const mediaUrl = `/media/video-translate/${job.id}/${sourceName}`;
        await this.prisma.videoTranslateJob.update({
            where: { id: job.id },
            data: { mediaUrl },
        });
        job = { ...job, mediaUrl };
        void this.processJob(job.id).catch((error) => {
            this.logger.error(`Video translate job ${job.id} failed: ${error instanceof Error ? error.message : String(error)}`);
        });
        return {
            job: this.serializeJob(job),
            quota: await this.getQuota(userId),
            fromCache: false,
        };
    }
    async createJob(userId, rawUrl) {
        const videoId = (0, youtube_util_1.extractYoutubeVideoId)(rawUrl);
        if (!videoId) {
            throw new common_1.BadRequestException('Link YouTube không hợp lệ. Hãy dùng link youtube.com/watch?v=..., youtu.be/... hoặc YouTube Shorts.');
        }
        const youtubeUrl = (0, youtube_util_1.youtubeWatchUrl)(videoId);
        const cached = await this.prisma.videoTranslateJob.findFirst({
            where: {
                youtubeVideoId: videoId,
                status: client_1.VideoTranslateStatus.READY,
                segmentsJson: { not: client_1.Prisma.DbNull },
                pipelineVersion: { gte: exports.DUBBED_PIPELINE_VERSION },
            },
            orderBy: { completedAt: 'desc' },
        });
        if (cached) {
            const repairedCached = await this.repairLegacyYoutubeDuration(cached);
            const cloned = await this.prisma.videoTranslateJob.create({
                data: {
                    userId,
                    youtubeVideoId: videoId,
                    youtubeUrl,
                    title: repairedCached.title,
                    thumbnailUrl: repairedCached.thumbnailUrl ?? (0, youtube_util_1.youtubeThumbnailUrl)(videoId),
                    durationSec: repairedCached.durationSec,
                    status: client_1.VideoTranslateStatus.READY,
                    source: repairedCached.source,
                    segmentsJson: repairedCached.segmentsJson ?? client_1.Prisma.JsonNull,
                    dubbedAudioUrl: null,
                    pipelineVersion: repairedCached.pipelineVersion,
                    fromCache: true,
                    completedAt: new Date(),
                },
            });
            return {
                job: this.serializeJob(cloned),
                quota: await this.getQuota(userId),
                fromCache: true,
            };
        }
        this.ensureOpenAi();
        await this.assertAndReserveQuota(userId);
        let job;
        try {
            job = await this.prisma.videoTranslateJob.create({
                data: {
                    userId,
                    youtubeVideoId: videoId,
                    youtubeUrl,
                    thumbnailUrl: (0, youtube_util_1.youtubeThumbnailUrl)(videoId),
                    status: client_1.VideoTranslateStatus.PENDING,
                    pipelineVersion: exports.DUBBED_PIPELINE_VERSION,
                },
            });
        }
        catch (error) {
            await this.releaseQuotaReservation(userId);
            throw error;
        }
        void this.processJob(job.id).catch((error) => {
            this.logger.error(`Video translate job ${job.id} failed: ${error instanceof Error ? error.message : String(error)}`);
        });
        return {
            job: this.serializeJob(job),
            quota: await this.getQuota(userId),
            fromCache: false,
        };
    }
    async processJob(jobId) {
        if (this.processing.has(jobId))
            return;
        this.processing.add(jobId);
        const startedAt = Date.now();
        const logStage = (stage) => {
            this.logger.log(`Video translate job ${jobId}: ${stage} (+${Date.now() - startedAt}ms)`);
        };
        const jobDir = (0, path_1.join)(process.cwd(), 'storage', 'video-translate', jobId);
        const workDir = (0, path_1.join)(jobDir, 'work');
        (0, fs_1.mkdirSync)(workDir, { recursive: true });
        try {
            const job = await this.prisma.videoTranslateJob.findUnique({
                where: { id: jobId },
            });
            if (!job)
                return;
            await this.prisma.videoTranslateJob.update({
                where: { id: jobId },
                data: { status: client_1.VideoTranslateStatus.PROCESSING, errorMessage: null },
            });
            const user = await this.prisma.user.findUniqueOrThrow({
                where: { id: job.userId },
                select: { isPremium: true, premiumExpiresAt: true },
            });
            const isPremium = this.resolvePremium(user);
            const maxSeconds = isPremium
                ? this.maxSecondsPremium()
                : this.maxSecondsFree();
            if (job.youtubeVideoId && job.youtubeUrl) {
                const meta = await this.fetchVideoMeta(job.youtubeVideoId, job.youtubeUrl);
                if (meta.durationSec != null && meta.durationSec > maxSeconds) {
                    throw new common_1.BadRequestException(`Video dài ${Math.ceil(meta.durationSec / 60)} phút — tối đa ${Math.floor(maxSeconds / 60)} phút cho tài khoản ${isPremium ? 'Premium' : 'miễn phí'}.`);
                }
                await this.prisma.videoTranslateJob.update({
                    where: { id: jobId },
                    data: {
                        title: meta.title,
                        durationSec: meta.durationSec,
                        thumbnailUrl: meta.thumbnailUrl ?? (0, youtube_util_1.youtubeThumbnailUrl)(job.youtubeVideoId),
                    },
                });
                logStage('metadata ready');
                const { segments: timed, source } = await this.getTimedTranscript(job.youtubeVideoId, job.youtubeUrl, workDir, meta.durationSec ?? maxSeconds);
                logStage('transcript ready');
                if (!timed.length) {
                    throw new common_1.BadRequestException('Không tìm thấy lời thoại tiếng Anh trong video này');
                }
                const durationSec = meta.durationSec ?? this.inferTranscriptDuration(timed);
                if (durationSec > maxSeconds) {
                    throw new common_1.BadRequestException(`Video dài ${Math.ceil(durationSec / 60)} phút - tối đa ${Math.floor(maxSeconds / 60)} phút cho tài khoản ${isPremium ? 'Premium' : 'miễn phí'}.`);
                }
                const translated = await this.translateSegments(timed);
                logStage('translations ready');
                await this.prisma.videoTranslateJob.update({
                    where: { id: jobId },
                    data: {
                        status: client_1.VideoTranslateStatus.READY,
                        source,
                        durationSec,
                        segmentsJson: translated,
                        dubbedAudioUrl: null,
                        pipelineVersion: exports.DUBBED_PIPELINE_VERSION,
                        completedAt: new Date(),
                        errorMessage: null,
                    },
                });
                logStage('completed');
                return;
            }
            if (!job.mediaUrl) {
                throw new common_1.BadRequestException('Job thiếu nguồn video hoặc audio');
            }
            const sourcePath = this.resolveMediaPath(job.mediaUrl);
            if (!sourcePath || !(0, fs_1.existsSync)(sourcePath)) {
                throw new common_1.BadRequestException('Không tìm thấy file đã tải lên');
            }
            const probedDurationSec = await this.probeDurationSec(sourcePath);
            const durationSec = Math.max(1, Math.round(probedDurationSec));
            if (durationSec > maxSeconds) {
                throw new common_1.BadRequestException(`Video dài ${Math.ceil(durationSec / 60)} phút — tối đa ${Math.floor(maxSeconds / 60)} phút cho tài khoản ${isPremium ? 'Premium' : 'miễn phí'}.`);
            }
            await this.prisma.videoTranslateJob.update({
                where: { id: jobId },
                data: {
                    title: job.title || job.originalFilename || 'Video đã tải lên',
                    durationSec,
                },
            });
            logStage('metadata ready');
            const thumbnailTask = this.extractUploadThumbnail(sourcePath, jobDir, jobId)
                .then(async (thumbnailUrl) => {
                if (!thumbnailUrl)
                    return;
                await this.prisma.videoTranslateJob.update({
                    where: { id: jobId },
                    data: { thumbnailUrl },
                });
            })
                .catch((error) => {
                this.logger.warn(`Thumbnail update failed for job ${jobId}: ${error instanceof Error ? error.message : String(error)}`);
            });
            const audioPath = await this.prepareAudioForWhisper(sourcePath, workDir);
            logStage('audio ready');
            const whisperTranscript = await this.transcribeWithWhisper(audioPath);
            logStage('transcript ready');
            const normalized = whisperTranscript.segments.map((seg) => ({
                start: seg.start,
                end: seg.end || Math.min(durationSec, seg.start + 4),
                en: seg.en,
            }));
            const timed = this.finalizeSegments(normalized, durationSec, whisperTranscript.words);
            const [translated] = await Promise.all([
                this.translateSegments(timed),
                thumbnailTask,
            ]);
            logStage('translations ready');
            await this.prisma.videoTranslateJob.update({
                where: { id: jobId },
                data: {
                    status: client_1.VideoTranslateStatus.READY,
                    source: 'upload-whisper',
                    segmentsJson: translated,
                    dubbedAudioUrl: null,
                    pipelineVersion: exports.DUBBED_PIPELINE_VERSION,
                    completedAt: new Date(),
                    errorMessage: null,
                },
            });
            logStage('completed');
        }
        catch (error) {
            const message = error instanceof common_1.BadRequestException
                ? typeof error.getResponse() === 'string'
                    ? error.getResponse()
                    : (error.getResponse().message ??
                        error.message)
                : error instanceof Error
                    ? error.message
                    : 'Xử lý video thất bại';
            await this.prisma.videoTranslateJob.update({
                where: { id: jobId },
                data: {
                    status: client_1.VideoTranslateStatus.FAILED,
                    errorMessage: message,
                },
            });
            const job = await this.prisma.videoTranslateJob.findUnique({
                where: { id: jobId },
                select: { userId: true },
            });
            if (job)
                await this.releaseQuotaReservation(job.userId);
        }
        finally {
            this.processing.delete(jobId);
            try {
                (0, fs_1.rmSync)(workDir, { recursive: true, force: true });
            }
            catch {
            }
        }
    }
    resolveUploadExtension(filename, mime) {
        const fromName = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
        const allowed = new Set([
            'mp4',
            'webm',
            'mov',
            'mkv',
            'mp3',
            'm4a',
            'wav',
            'mpeg',
            'mpg',
        ]);
        if (fromName && allowed.has(fromName)) {
            return fromName === 'mpeg' || fromName === 'mpg' ? 'mp4' : fromName;
        }
        const lowerMime = String(mime || '').toLowerCase();
        if (lowerMime.includes('mp4') || lowerMime.includes('quicktime'))
            return 'mp4';
        if (lowerMime.includes('webm'))
            return 'webm';
        if (lowerMime.includes('audio/mpeg'))
            return 'mp3';
        if (lowerMime.includes('audio/mp4') || lowerMime.includes('m4a'))
            return 'm4a';
        if (lowerMime.includes('wav'))
            return 'wav';
        if (lowerMime.includes('matroska'))
            return 'mkv';
        return null;
    }
    titleFromFilename(filename) {
        const base = filename.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '');
        const cleaned = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
        return cleaned.slice(0, 120) || 'Video đã tải lên';
    }
    resolveMediaPath(mediaUrl) {
        const match = mediaUrl.match(/^\/media\/(.+)$/);
        if (!match)
            return null;
        return (0, path_1.join)(process.cwd(), 'storage', ...match[1].split('/'));
    }
    async extractUploadThumbnail(sourcePath, jobDir, jobId) {
        if (/\.(mp3|m4a|wav|opus)$/i.test(sourcePath)) {
            return null;
        }
        const thumbName = 'thumb.jpg';
        const thumbPath = (0, path_1.join)(jobDir, thumbName);
        const ffmpeg = this.resolveFfmpegPath();
        const attempts = [
            [
                '-y',
                '-ss',
                '1',
                '-i',
                sourcePath,
                '-frames:v',
                '1',
                '-q:v',
                '4',
                '-vf',
                'scale=320:-2',
                thumbPath,
            ],
            [
                '-y',
                '-i',
                sourcePath,
                '-frames:v',
                '1',
                '-q:v',
                '4',
                '-vf',
                'scale=320:-2',
                thumbPath,
            ],
        ];
        for (const args of attempts) {
            try {
                await execFileAsync(ffmpeg, args, {
                    timeout: 60_000,
                    maxBuffer: 4 * 1024 * 1024,
                });
                if ((0, fs_1.existsSync)(thumbPath)) {
                    return `/media/video-translate/${jobId}/${thumbName}`;
                }
            }
            catch {
            }
        }
        this.logger.warn(`Không tạo được thumbnail cho job ${jobId}`);
        return null;
    }
    async prepareAudioForWhisper(sourcePath, workDir) {
        const outPath = (0, path_1.join)(workDir, 'whisper.mp3');
        const ffmpeg = this.resolveFfmpegPath();
        try {
            await execFileAsync(ffmpeg, [
                '-y',
                '-hide_banner',
                '-loglevel',
                'error',
                '-i',
                sourcePath,
                '-map',
                '0:a:0',
                '-vn',
                '-sn',
                '-dn',
                '-ac',
                '1',
                '-ar',
                '16000',
                '-c:a',
                'libmp3lame',
                '-b:a',
                '48k',
                outPath,
            ], { timeout: 180_000, maxBuffer: 4 * 1024 * 1024 });
        }
        catch (error) {
            this.logger.error(`ffmpeg extract audio failed: ${this.commandErrorLog(error)}`);
            throw new common_1.ServiceUnavailableException('Không chuẩn hóa được audio từ file tải lên. Thử file mp3/m4a hoặc mp4 khác.');
        }
        if (!(0, fs_1.existsSync)(outPath)) {
            throw new common_1.ServiceUnavailableException('Không tạo được file audio để nhận dạng');
        }
        return outPath;
    }
    async prepareFeaturedTranscript(videoId, durationSec, workDir) {
        this.ensureOpenAi();
        const readTrack = () => {
            for (const language of ['en-US', 'en-GB', 'en-orig', 'en']) {
                const path = (0, path_1.join)(workDir, `captions.${language}.json3`);
                if (!(0, fs_1.existsSync)(path))
                    continue;
                try {
                    const cues = (0, featured_video_captions_1.parseFeaturedCaptions)(JSON.parse((0, fs_1.readFileSync)(path, 'utf8')), durationSec);
                    if (cues.length)
                        return this.finalizeSegments(cues, durationSec, this.buildCaptionWordTimings(cues, durationSec))
                            .map((segment) => ({
                            ...segment,
                            end: Math.min(durationSec, segment.end),
                        }))
                            .filter((segment) => segment.end > segment.start);
                }
                catch {
                }
            }
            return [];
        };
        let timed = readTrack();
        if (!timed.length) {
            try {
                await execFileAsync(this.resolveYtDlpPath(), [
                    '--js-runtimes',
                    'node',
                    ...this.ytDlpConnectionArgs(),
                    '--skip-download',
                    '--no-playlist',
                    '--write-subs',
                    '--write-auto-subs',
                    '--sub-langs',
                    'en,en-US,en-GB,en-orig',
                    '--sub-format',
                    'json3',
                    '--output',
                    (0, path_1.join)(workDir, 'captions.%(ext)s'),
                    (0, youtube_util_1.youtubeWatchUrl)(videoId),
                ], { timeout: 90_000, maxBuffer: 4 * 1024 * 1024 });
            }
            catch {
            }
            timed = readTrack();
        }
        if (!timed.length) {
            timed = (await this.getTimedTranscript(videoId, (0, youtube_util_1.youtubeWatchUrl)(videoId), workDir, durationSec)).segments;
        }
        return this.translateSegments(timed);
    }
    async getTimedTranscript(videoId, youtubeUrl, workDir, durationSec) {
        const captionTranscript = await this.tryFetchCaptions(videoId, durationSec);
        if (captionTranscript.segments.length > 0) {
            return {
                segments: this.finalizeSegments(captionTranscript.segments, durationSec, captionTranscript.words),
                source: 'captions',
            };
        }
        this.logger.log(`No captions for ${videoId} — using Whisper STT`);
        const audioPath = await this.downloadAudio(youtubeUrl, workDir);
        const whisperTranscript = await this.transcribeWithWhisper(audioPath);
        const normalized = whisperTranscript.segments.map((seg) => ({
            start: seg.start,
            end: seg.end || Math.min(durationSec, seg.start + 4),
            en: seg.en,
        }));
        return {
            segments: this.finalizeSegments(normalized, durationSec, whisperTranscript.words),
            source: 'whisper',
        };
    }
    async tryFetchCaptions(videoId, durationSec) {
        try {
            let items = await (0, youtube_transcript_1.fetchTranscript)(videoId, { lang: 'en' });
            if (!items?.length) {
                items = await (0, youtube_transcript_1.fetchTranscript)(videoId);
            }
            if (!items?.length)
                return { segments: [], words: [] };
            const maxOffset = Math.max(...items.map((item) => Number(item.offset) || 0));
            const unitIsMs = maxOffset > durationSec * 1.5 + 5;
            const segments = items
                .map((item) => {
                const rawStart = Number(item.offset) || 0;
                const rawDur = Number(item.duration) || 0;
                const start = unitIsMs ? rawStart / 1000 : rawStart;
                const duration = unitIsMs ? rawDur / 1000 : rawDur;
                const en = this.cleanCaptionText(item.text);
                if (!en)
                    return null;
                const wordCount = en.split(/\s+/).filter(Boolean).length;
                const safeDur = duration > 0.12
                    ? duration
                    : Math.min(4, Math.max(0.45, 0.3 + wordCount * 0.25));
                return {
                    start: Number.isFinite(start) ? start : 0,
                    end: Number.isFinite(start + safeDur) ? start + safeDur : start + 2,
                    en,
                };
            })
                .filter((seg) => seg != null && seg.en.length > 0)
                .sort((a, b) => a.start - b.start || a.end - b.end);
            return {
                segments,
                words: this.buildCaptionWordTimings(segments, durationSec),
            };
        }
        catch (error) {
            this.logger.warn(`Caption fetch failed for ${videoId}: ${error instanceof Error ? error.message : String(error)}`);
            return { segments: [], words: [] };
        }
    }
    cleanCaptionText(text) {
        return text
            .replace(/\[.*?\]/g, ' ')
            .replace(/\(.*?\)/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    buildCaptionWordTimings(segments, durationSec) {
        const words = [];
        const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
        segments.forEach((segment, index) => {
            const nextStart = segments[index + 1]?.start;
            const clippedEnd = nextStart != null && nextStart > segment.start + 0.05
                ? Math.min(segment.end, nextStart)
                : segment.end;
            const end = Math.min(durationSec, Math.max(segment.start + 0.12, clippedEnd));
            const estimated = this.estimateWordTimings({ ...segment, end }).map((word) => ({ start: word.start, end: word.end, en: word.text }));
            const maxOverlap = Math.min(words.length, estimated.length);
            let overlap = maxOverlap;
            while (overlap > 0) {
                const tail = words.slice(-overlap);
                const head = estimated.slice(0, overlap);
                if (tail.every((word, wordIndex) => normalize(word.en).length > 0 &&
                    normalize(word.en) === normalize(head[wordIndex].en))) {
                    break;
                }
                overlap -= 1;
            }
            words.push(...estimated.slice(overlap));
        });
        return words;
    }
    finalizeSegments(segments, durationSec, wordTimings = []) {
        const sorted = [...segments].sort((a, b) => a.start - b.start || a.end - b.end);
        const collapsed = this.collapseRollingCaptions(sorted);
        const sentenceParts = this.splitMultiSentence(collapsed);
        const utterances = this.mergeIntoUtterances(sentenceParts);
        const aligned = this.alignSegmentWindows(utterances, durationSec).filter((seg) => seg.en.trim().length > 0);
        return wordTimings.length
            ? this.attachWordTimings(aligned, wordTimings)
            : aligned;
    }
    wordCount(text) {
        return text.split(/\s+/).filter(Boolean).length;
    }
    endsUtterance(text) {
        return /[.!?…]["')\]]?\s*$/.test(text.trim());
    }
    joinSegmentText(left, right) {
        const leftWords = left.trim().split(/\s+/).filter(Boolean);
        const rightWords = right.trim().split(/\s+/).filter(Boolean);
        const comparable = (word) => word.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
        const leftComparable = leftWords.map(comparable);
        const rightComparable = rightWords.map(comparable);
        let overlap = Math.min(leftWords.length, rightWords.length);
        while (overlap > 0) {
            const leftTail = leftComparable.slice(-overlap);
            const rightHead = rightComparable.slice(0, overlap);
            if (leftTail.every((word, index) => word.length > 0 && word === rightHead[index])) {
                break;
            }
            overlap -= 1;
        }
        return [...leftWords, ...rightWords.slice(overlap)]
            .join(' ')
            .replace(/\s+([,.;!?…])/g, '$1')
            .trim();
    }
    mergeTwoSegments(a, b) {
        return {
            start: Math.min(a.start, b.start),
            end: Math.max(a.end, b.end),
            en: this.joinSegmentText(a.en, b.en),
        };
    }
    collapseRollingCaptions(segments) {
        const out = [];
        for (const seg of segments) {
            const last = out[out.length - 1];
            if (!last) {
                out.push({ ...seg });
                continue;
            }
            const normalizeWords = (text) => text
                .toLowerCase()
                .split(/\s+/)
                .map((word) => word.replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, ''))
                .filter(Boolean);
            const lastWords = normalizeWords(last.en);
            const nextWords = normalizeWords(seg.en);
            const overlaps = seg.start <= last.end + 0.25;
            const containsSequence = (haystack, needle) => {
                if (!needle.length || needle.length > haystack.length)
                    return false;
                return haystack.some((_, start) => needle.every((word, index) => haystack[start + index] === word));
            };
            const sameText = lastWords.length === nextWords.length &&
                lastWords.every((word, index) => word === nextWords[index]);
            const oneContainsTheOther = containsSequence(nextWords, lastWords) ||
                containsSequence(lastWords, nextWords);
            const isExtension = sameText ||
                (oneContainsTheOther &&
                    (!this.endsUtterance(last.en) || seg.start <= last.end));
            if (overlaps && isExtension) {
                last.end = Math.max(last.end, seg.end);
                if (nextWords.length >= lastWords.length)
                    last.en = seg.en;
                continue;
            }
            out.push({ ...seg });
        }
        return out;
    }
    mergeIntoUtterances(segments) {
        const { pauseBreakSec, timestampEpsilonSec } = TRANSCRIPT_RULES;
        const merged = [];
        for (const seg of segments) {
            const last = merged[merged.length - 1];
            if (!last) {
                merged.push({ ...seg });
                continue;
            }
            const gap = seg.start - last.end;
            const lastEnded = this.endsUtterance(last.en);
            if (gap + timestampEpsilonSec >= pauseBreakSec || lastEnded) {
                merged.push({ ...seg });
                continue;
            }
            const joined = this.mergeTwoSegments(last, seg);
            last.start = joined.start;
            last.end = joined.end;
            last.en = joined.en;
        }
        return merged;
    }
    splitMultiSentence(segments) {
        const out = [];
        const sentenceSegmenter = new Intl.Segmenter('en', {
            granularity: 'sentence',
        });
        for (const seg of segments) {
            const parts = Array.from(sentenceSegmenter.segment(seg.en), (part) => part.segment.trim()).filter(Boolean);
            if (parts.length <= 1) {
                out.push({ ...seg });
                continue;
            }
            const totalDur = Math.max(0.45, seg.end - seg.start);
            const totalChars = parts.reduce((sum, part) => sum + part.length, 0) || 1;
            let cursor = seg.start;
            parts.forEach((part, index) => {
                const share = part.length / totalChars;
                const dur = Math.max(0.4, totalDur * share);
                const end = index === parts.length - 1
                    ? seg.end
                    : Math.min(seg.end, cursor + dur);
                out.push({ start: cursor, end, en: part });
                cursor = end;
            });
        }
        return out;
    }
    alignSegmentWindows(segments, durationSec) {
        const sorted = [...segments].sort((a, b) => a.start - b.start || a.end - b.end);
        return sorted.map((seg, index) => {
            const isLast = index >= sorted.length - 1;
            const nextStart = isLast
                ? Math.max(durationSec, seg.end + 0.8)
                : sorted[index + 1].start;
            const words = this.wordCount(seg.en);
            const minEnd = seg.start + Math.min(6.5, 0.4 + words * 0.3);
            let end = Math.max(seg.end, minEnd);
            if (!isLast) {
                const gap = nextStart - seg.end;
                if (gap + TRANSCRIPT_RULES.timestampEpsilonSec >=
                    TRANSCRIPT_RULES.pauseBreakSec) {
                    end = Math.min(seg.end, nextStart - 0.04);
                }
                else {
                    end = Math.max(seg.start + 0.35, nextStart - 0.04);
                }
            }
            return {
                ...seg,
                start: Math.max(0, seg.start),
                end: Math.max(seg.start + 0.12, end),
            };
        });
    }
    attachWordTimings(segments, rawWords) {
        const words = [...rawWords].sort((a, b) => a.start - b.start || a.end - b.end);
        const mappedSegments = segments.map((segment, index) => {
            const previousStart = segments[index - 1]?.start;
            const nextEnd = segments[index + 1]?.end;
            const lowerBound = (previousStart ?? segment.start - 1) - 0.1;
            const upperBound = (nextEnd ?? segment.end + 1) + 0.1;
            const candidates = words.filter((word) => {
                const midpoint = (word.start + word.end) / 2;
                return midpoint >= lowerBound && midpoint <= upperBound;
            });
            const mapped = this.mapWordsToSegment(segment, candidates);
            return {
                ...segment,
                words: mapped.length
                    ? this.stabilizeWordTimingWindows(mapped, segment.end)
                    : this.estimateWordTimings(segment),
            };
        });
        return mappedSegments.map((segment, index) => {
            if (!segment.words?.length)
                return segment;
            const firstWordStart = segment.words[0].start;
            const lastWordEnd = segment.words[segment.words.length - 1].end;
            const nextWordStart = mappedSegments[index + 1]?.words?.[0]?.start;
            const end = nextWordStart != null
                ? Math.max(lastWordEnd, nextWordStart - 0.04)
                : Math.max(lastWordEnd, segment.end);
            return {
                ...segment,
                start: firstWordStart,
                end: Math.max(firstWordStart + 0.12, end),
            };
        });
    }
    mapWordsToSegment(segment, candidates) {
        const displayWords = segment.en.split(/\s+/).filter(Boolean);
        const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
        for (let startOffset = 0; startOffset <= candidates.length - 1; startOffset += 1) {
            const mapped = [];
            let candidateIndex = startOffset;
            let failed = false;
            for (const displayWord of displayWords) {
                const target = normalize(displayWord);
                if (!target) {
                    failed = true;
                    break;
                }
                let combined = '';
                let matchedEnd = -1;
                for (let endIndex = candidateIndex; endIndex < Math.min(candidates.length, candidateIndex + 3); endIndex += 1) {
                    combined += normalize(candidates[endIndex].en);
                    if (combined === target) {
                        matchedEnd = endIndex;
                        break;
                    }
                    if (!target.startsWith(combined))
                        break;
                }
                if (matchedEnd < candidateIndex) {
                    failed = true;
                    break;
                }
                mapped.push({
                    text: displayWord,
                    start: candidates[candidateIndex].start,
                    end: candidates[matchedEnd].end,
                });
                candidateIndex = matchedEnd + 1;
            }
            if (!failed && mapped.length === displayWords.length)
                return mapped;
        }
        return [];
    }
    stabilizeWordTimingWindows(words, segmentEnd) {
        const stabilized = words.map((word) => ({ ...word }));
        let index = 0;
        while (index < stabilized.length) {
            let groupEnd = index;
            while (groupEnd + 1 < stabilized.length &&
                Math.abs(stabilized[groupEnd + 1].start - stabilized[index].start) <=
                    0.015) {
                groupEnd += 1;
            }
            if (groupEnd > index) {
                const group = stabilized.slice(index, groupEnd + 1);
                const nextStart = stabilized[groupEnd + 1]?.start ?? segmentEnd;
                const naturalEnd = Math.max(...group.map((word) => word.end));
                const windowEnd = Math.max(group[0].start + group.length * 0.08, Math.min(nextStart, naturalEnd));
                const weights = group.map((word) => Math.max(1, word.text.replace(/[^a-z0-9]+/gi, '').length));
                const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
                let cursor = group[0].start;
                group.forEach((word, groupIndex) => {
                    const end = groupIndex === group.length - 1
                        ? windowEnd
                        : cursor +
                            ((windowEnd - group[0].start) * weights[groupIndex]) /
                                totalWeight;
                    stabilized[index + groupIndex] = {
                        ...word,
                        start: cursor,
                        end,
                    };
                    cursor = end;
                });
            }
            else if (stabilized[index].end <= stabilized[index].start) {
                const nextStart = stabilized[index + 1]?.start ?? segmentEnd;
                stabilized[index].end = Math.min(nextStart, stabilized[index].start + 0.12);
            }
            index = groupEnd + 1;
        }
        return stabilized;
    }
    estimateWordTimings(segment) {
        const words = segment.en.split(/\s+/).filter(Boolean);
        const weights = words.map((word) => Math.max(1, word.replace(/[^a-z0-9]+/gi, '').length));
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
        const duration = Math.max(0.12, segment.end - segment.start);
        let cursor = segment.start;
        return words.map((text, index) => {
            const end = index === words.length - 1
                ? segment.end
                : cursor + (duration * weights[index]) / totalWeight;
            const timing = { text, start: cursor, end };
            cursor = end;
            return timing;
        });
    }
    async translateSegments(segments) {
        this.ensureOpenAi();
        if (!segments.length)
            return [];
        const batchSize = this.translationBatchSize();
        const batches = [];
        for (let i = 0; i < segments.length; i += batchSize) {
            batches.push(segments.slice(i, i + batchSize));
        }
        const translatedBatches = await this.runWithConcurrency(batches, this.translationConcurrency(), (batch) => this.translateBatch(batch));
        return translatedBatches.flat();
    }
    async translateBatch(batch) {
        const payload = batch.map((seg, idx) => ({ i: idx, en: seg.en }));
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: 'Translate each English transcript item into accurate, idiomatic contemporary Vietnamese for learners. Use neighboring items only to understand context and pronoun references, but translate exactly one source item per output index. Prefer natural Vietnamese phrasing over word-for-word wording and avoid redundancy. Preserve every idea: never omit content, merge items, or move content to another index. Keep names and factual details accurate. Return exactly one non-empty translation for every input index as JSON: {"items":[{"i":0,"vi":"..."}]}. No explanations.',
                },
                {
                    role: 'user',
                    content: JSON.stringify({ items: payload }),
                },
            ],
        });
        const raw = completion.choices[0]?.message?.content ?? '{}';
        const translations = new Map();
        try {
            const parsed = JSON.parse(raw);
            for (const item of parsed.items ?? []) {
                if (Number.isInteger(item?.i) &&
                    item.i >= 0 &&
                    item.i < batch.length &&
                    typeof item.vi === 'string' &&
                    item.vi.trim()) {
                    translations.set(item.i, item.vi.trim());
                }
            }
        }
        catch {
        }
        const missing = batch
            .map((segment, index) => ({ segment, index }))
            .filter(({ index }) => !translations.has(index));
        const fallbackTranslations = await this.runWithConcurrency(missing, this.translationConcurrency(), async ({ segment, index }) => ({
            index,
            vi: await this.translateOne(segment.en),
        }));
        for (const fallback of fallbackTranslations) {
            translations.set(fallback.index, fallback.vi);
        }
        return batch.map((seg, index) => ({
            start: seg.start,
            end: seg.end,
            en: seg.en,
            ...(seg.words?.length ? { words: seg.words } : {}),
            vi: translations.get(index) || seg.en,
        }));
    }
    async runWithConcurrency(items, concurrency, worker) {
        if (!items.length)
            return [];
        const results = new Array(items.length);
        let nextIndex = 0;
        const workerCount = Math.min(items.length, Math.max(1, Math.floor(concurrency)));
        await Promise.all(Array.from({ length: workerCount }, async () => {
            while (nextIndex < items.length) {
                const index = nextIndex;
                nextIndex += 1;
                results[index] = await worker(items[index], index);
            }
        }));
        return results;
    }
    async translateOne(text) {
        this.ensureOpenAi();
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.2,
            messages: [
                {
                    role: 'system',
                    content: 'Translate the complete English sentence into accurate, natural Vietnamese. Preserve every idea and factual detail. Do not shorten or omit content. Return only the translation.',
                },
                { role: 'user', content: text },
            ],
        });
        return completion.choices[0]?.message?.content?.trim() || text;
    }
    async buildDubbedAudio(jobId, jobDir, workDir, segments, durationSec) {
        const partsDir = (0, path_1.join)(workDir, 'parts');
        (0, fs_1.mkdirSync)(partsDir, { recursive: true });
        const partFiles = [];
        for (let i = 0; i < segments.length; i += 1) {
            const seg = segments[i];
            if (!seg.vi.trim())
                continue;
            const nextStart = segments[i + 1]?.start ?? durationSec;
            const windowEnd = Math.max(seg.start + 0.35, Math.min(seg.end + 0.15, nextStart - 0.04));
            const targetDur = Math.max(0.35, windowEnd - seg.start);
            const buffer = await this.synthesizeVietnamese(seg.vi);
            const rawPath = (0, path_1.join)(partsDir, `raw-${String(i).padStart(3, '0')}.mp3`);
            const fittedPath = (0, path_1.join)(partsDir, `fit-${String(i).padStart(3, '0')}.mp3`);
            (0, fs_1.writeFileSync)(rawPath, buffer);
            await this.fitSpeechToWindow(rawPath, fittedPath, targetDur);
            partFiles.push({
                path: fittedPath,
                delayMs: Math.max(0, Math.round(seg.start * 1000)),
            });
        }
        if (partFiles.length === 0) {
            throw new common_1.BadRequestException('Không tạo được audio tiếng Việt từ transcript');
        }
        (0, fs_1.mkdirSync)(jobDir, { recursive: true });
        const outPath = (0, path_1.join)(jobDir, 'dubbed.mp3');
        const silencePath = (0, path_1.join)(workDir, 'silence.mp3');
        const totalSec = Math.max(durationSec, Math.ceil(segments.at(-1)?.end ?? 1) + 1);
        await this.runFfmpeg([
            '-y',
            '-f',
            'lavfi',
            '-i',
            `anullsrc=r=44100:cl=mono`,
            '-t',
            String(totalSec),
            '-q:a',
            '9',
            silencePath,
        ]);
        let currentBase = silencePath;
        const batchSize = 8;
        for (let i = 0; i < partFiles.length; i += batchSize) {
            const batch = partFiles.slice(i, i + batchSize);
            const mixedPath = (0, path_1.join)(workDir, `mix-${i}.mp3`);
            const inputs = ['-y', '-i', currentBase];
            for (const part of batch) {
                inputs.push('-i', part.path);
            }
            const filters = [];
            const mixInputs = ['[0:a]'];
            batch.forEach((part, idx) => {
                const label = `a${idx}`;
                filters.push(`[${idx + 1}:a]adelay=${part.delayMs}|${part.delayMs},volume=1.15[${label}]`);
                mixInputs.push(`[${label}]`);
            });
            filters.push(`${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=0:normalize=0[out]`);
            await this.runFfmpeg([
                ...inputs,
                '-filter_complex',
                filters.join(';'),
                '-map',
                '[out]',
                '-q:a',
                '4',
                mixedPath,
            ]);
            currentBase = mixedPath;
        }
        (0, fs_1.writeFileSync)(outPath, (0, fs_1.readFileSync)(currentBase));
        return `/media/video-translate/${jobId}/dubbed.mp3`;
    }
    async fitSpeechToWindow(inputPath, outputPath, targetDur) {
        const rawDur = await this.probeDurationSec(inputPath);
        if (!Number.isFinite(rawDur) || rawDur <= 0.05) {
            (0, fs_1.writeFileSync)(outputPath, (0, fs_1.readFileSync)(inputPath));
            return;
        }
        let speed = rawDur / targetDur;
        speed = Math.min(1.75, Math.max(0.8, speed));
        const atempo = this.buildAtempoFilter(speed);
        const fadeStart = Math.max(0, targetDur - 0.08);
        const filter = [
            atempo,
            `apad=pad_dur=${targetDur.toFixed(3)}`,
            `atrim=0:${targetDur.toFixed(3)}`,
            `afade=t=out:st=${fadeStart.toFixed(3)}:d=0.08`,
        ].join(',');
        await this.runFfmpeg([
            '-y',
            '-i',
            inputPath,
            '-af',
            filter,
            '-q:a',
            '4',
            outputPath,
        ]);
    }
    buildAtempoFilter(speed) {
        const parts = [];
        let remaining = speed;
        while (remaining > 2) {
            parts.push('atempo=2.0');
            remaining /= 2;
        }
        while (remaining < 0.5) {
            parts.push('atempo=0.5');
            remaining /= 0.5;
        }
        parts.push(`atempo=${remaining.toFixed(4)}`);
        return parts.join(',');
    }
    async probeDurationSec(filePath) {
        const ffmpeg = this.resolveFfmpegPath();
        try {
            const { stderr } = await execFileAsync(ffmpeg, ['-i', filePath, '-f', 'null', '-'], { timeout: 30_000, maxBuffer: 2 * 1024 * 1024 });
            const match = String(stderr).match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
            if (!match)
                return 0;
            const h = Number(match[1]);
            const m = Number(match[2]);
            const s = Number(match[3]);
            return h * 3600 + m * 60 + s;
        }
        catch (error) {
            const stderr = error && typeof error === 'object' && 'stderr' in error
                ? String(error.stderr ?? '')
                : '';
            const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
            if (!match)
                return 0;
            return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
        }
    }
    async synthesizeVietnamese(text) {
        const elevenKey = this.config.get('ELEVENLABS_API_KEY')?.trim();
        const voiceId = this.config.get('ELEVENLABS_VOICE_ID')?.trim();
        if (elevenKey && voiceId) {
            return this.synthesizeElevenLabs(text, elevenKey, voiceId);
        }
        return this.synthesizeOpenAiTts(text);
    }
    async synthesizeElevenLabs(text, apiKey, voiceId) {
        const model = this.config.get('ELEVENLABS_MODEL_ID')?.trim() ||
            'eleven_turbo_v2_5';
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                Accept: 'audio/mpeg',
            },
            body: JSON.stringify({
                text,
                model_id: model,
                voice_settings: {
                    stability: 0.45,
                    similarity_boost: 0.75,
                    style: 0.1,
                    use_speaker_boost: true,
                },
            }),
        });
        if (!res.ok) {
            const body = await res.text();
            throw new common_1.ServiceUnavailableException(`ElevenLabs TTS lỗi (${res.status}): ${body.slice(0, 200)}`);
        }
        return Buffer.from(await res.arrayBuffer());
    }
    async synthesizeOpenAiTts(text) {
        this.ensureOpenAi();
        try {
            const speech = await this.openai.audio.speech.create({
                model: 'gpt-4o-mini-tts',
                voice: 'alloy',
                input: text,
                instructions: 'Speak clear Vietnamese at a natural conversational pace.',
                response_format: 'mp3',
            });
            return Buffer.from(await speech.arrayBuffer());
        }
        catch (error) {
            const speech = await this.openai.audio.speech.create({
                model: 'tts-1',
                voice: 'alloy',
                input: text,
                response_format: 'mp3',
            });
            this.logger.warn(`gpt-4o-mini-tts unavailable, fell back to tts-1: ${error instanceof Error ? error.message : String(error)}`);
            return Buffer.from(await speech.arrayBuffer());
        }
    }
    async downloadAudio(youtubeUrl, workDir) {
        const ytDlp = this.resolveYtDlpPath();
        const ffmpeg = this.resolveFfmpegPath();
        const outTemplate = (0, path_1.join)(workDir, 'audio.%(ext)s');
        const connectionArgs = this.ytDlpConnectionArgs();
        const usingProxy = connectionArgs.includes('--proxy');
        const runDownload = (args) => execFileAsync(ytDlp, [
            '--js-runtimes',
            'node',
            ...args,
            '-f',
            'bestaudio/best',
            '-x',
            '--audio-format',
            'mp3',
            '--audio-quality',
            '5',
            '--ffmpeg-location',
            ffmpeg,
            '--no-playlist',
            '-o',
            outTemplate,
            youtubeUrl,
        ], { timeout: 180_000, maxBuffer: 10 * 1024 * 1024 });
        try {
            await runDownload(connectionArgs);
        }
        catch (error) {
            const detail = this.commandErrorDetail(error);
            this.logger.error(`yt-dlp download failed: ${this.commandErrorLog(error)}`);
            if (usingProxy && this.isProxyParseError(detail)) {
                this.logger.warn('YT_DLP_PROXY không hợp lệ; đang thử tải lại bằng kết nối trực tiếp.');
                try {
                    await runDownload(this.ytDlpConnectionArgs(false));
                }
                catch (retryError) {
                    const retryDetail = this.commandErrorDetail(retryError);
                    this.logger.error(`yt-dlp direct retry failed: ${this.commandErrorLog(retryError)}`);
                    throw new common_1.ServiceUnavailableException(this.ytDlpInvalidProxyError(retryDetail, true));
                }
            }
            else if (this.hasConfiguredYtDlpProxy() &&
                !this.normalizedYtDlpProxy()) {
                throw new common_1.ServiceUnavailableException(this.ytDlpInvalidProxyError(detail));
            }
            else {
                throw new common_1.ServiceUnavailableException(this.ytDlpUserFacingError(detail));
            }
        }
        const files = (0, fs_1.readdirSync)(workDir).filter((name) => /^audio\.(mp3|m4a|webm|opus|wav)$/i.test(name));
        if (!files.length) {
            throw new common_1.ServiceUnavailableException('Không tìm thấy file audio sau khi tải');
        }
        return (0, path_1.join)(workDir, files[0]);
    }
    async transcribeWithWhisper(audioPath) {
        this.ensureOpenAi();
        const result = await this.openai.audio.transcriptions.create({
            file: (0, fs_1.createReadStream)(audioPath),
            model: 'whisper-1',
            language: 'en',
            response_format: 'verbose_json',
            timestamp_granularities: ['word', 'segment'],
        });
        const timedResult = result;
        const words = (timedResult.words ?? [])
            .map((word) => {
            const start = Number(word.start) || 0;
            return {
                start,
                end: Number(word.end) || start + 0.3,
                en: this.cleanCaptionText(String(word.word ?? '')),
            };
        })
            .filter((word) => word.en.length > 0);
        return {
            segments: this.buildWhisperTimedSegments(timedResult),
            words,
        };
    }
    buildWhisperTimedSegments(timedResult) {
        const words = (timedResult.words ?? [])
            .map((word) => {
            const start = Number(word.start) || 0;
            return {
                start,
                end: Number(word.end) || start + 0.3,
                en: this.cleanCaptionText(String(word.word ?? '')),
            };
        })
            .filter((word) => word.en.length > 0);
        const captionSegments = (timedResult.segments ?? [])
            .map((segment) => {
            const start = Number(segment.start) || 0;
            return {
                start,
                end: Number(segment.end) || start + 2,
                en: this.cleanCaptionText(String(segment.text ?? '')),
            };
        })
            .filter((segment) => segment.en.length > 0);
        if (captionSegments.length) {
            return this.splitWhisperSegmentsAtInternalPauses(captionSegments, words);
        }
        if (words.length)
            return words;
        if (timedResult.text) {
            return [
                {
                    start: 0,
                    end: 4,
                    en: String(timedResult.text).trim(),
                },
            ];
        }
        return [];
    }
    splitWhisperSegmentsAtInternalPauses(segments, words) {
        if (!words.length)
            return segments;
        const out = [];
        let wordCursor = 0;
        for (const segment of segments) {
            while (wordCursor < words.length &&
                words[wordCursor].end < segment.start - 0.08) {
                wordCursor += 1;
            }
            const segmentWords = [];
            while (wordCursor < words.length) {
                const word = words[wordCursor];
                const midpoint = (word.start + word.end) / 2;
                if (midpoint > segment.end + 0.08)
                    break;
                if (midpoint >= segment.start - 0.08)
                    segmentWords.push(word);
                wordCursor += 1;
            }
            const groups = [];
            for (const word of segmentWords) {
                const group = groups[groups.length - 1];
                const previousWord = group?.[group.length - 1];
                if (!group ||
                    (previousWord &&
                        word.start -
                            previousWord.end +
                            TRANSCRIPT_RULES.timestampEpsilonSec >=
                            TRANSCRIPT_RULES.pauseBreakSec)) {
                    groups.push([word]);
                }
                else {
                    group.push(word);
                }
            }
            if (groups.length <= 1) {
                out.push(segment);
                continue;
            }
            const terminalPunctuation = segment.en.match(/([.!?…]+["')\]]?)\s*$/)?.[1] ?? '';
            groups.forEach((group, index) => {
                let en = group
                    .map((word) => word.en)
                    .join(' ')
                    .trim();
                if (index === groups.length - 1 && terminalPunctuation) {
                    en = `${en.replace(/[.!?…]+$/, '')}${terminalPunctuation}`;
                }
                out.push({
                    start: group[0].start,
                    end: group[group.length - 1].end,
                    en,
                });
            });
        }
        return out;
    }
    async fetchVideoMeta(videoId, youtubeUrl) {
        try {
            const ytDlp = this.resolveYtDlpPath();
            const { stdout } = await execFileAsync(ytDlp, [
                '--js-runtimes',
                'node',
                ...this.ytDlpConnectionArgs(),
                '--dump-json',
                '--no-playlist',
                youtubeUrl,
            ], { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });
            const data = JSON.parse(stdout);
            return {
                title: data.title?.trim() || `YouTube ${videoId}`,
                durationSec: Math.max(1, Math.round(Number(data.duration) || 1)),
                thumbnailUrl: data.thumbnail || (0, youtube_util_1.youtubeThumbnailUrl)(videoId),
            };
        }
        catch {
            const durationSec = await this.fetchYoutubeWatchDuration(youtubeUrl);
            let title = `YouTube ${videoId}`;
            let thumbnailUrl = (0, youtube_util_1.youtubeThumbnailUrl)(videoId);
            try {
                const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
                if (res.ok) {
                    const data = (await res.json());
                    title = data.title?.trim() || title;
                    thumbnailUrl = data.thumbnail_url || thumbnailUrl;
                }
            }
            catch {
            }
            return {
                title,
                durationSec,
                thumbnailUrl,
            };
        }
    }
    parseYoutubeWatchDuration(content) {
        const match = content.match(/"lengthSeconds"\s*:\s*"?(\d+)"?/);
        const durationSec = Number(match?.[1]);
        return Number.isFinite(durationSec) && durationSec > 0
            ? Math.round(durationSec)
            : null;
    }
    async fetchYoutubeWatchDuration(youtubeUrl) {
        try {
            const response = await fetch(youtubeUrl, {
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127 Safari/537.36',
                    'accept-language': 'en-US,en;q=0.9',
                },
                signal: AbortSignal.timeout(15_000),
            });
            if (!response.ok)
                return null;
            return this.parseYoutubeWatchDuration(await response.text());
        }
        catch {
            return null;
        }
    }
    inferTranscriptDuration(segments) {
        const lastTimestamp = segments.reduce((max, segment) => Math.max(max, segment.end, segment.start), 0);
        return Math.max(1, Math.ceil(lastTimestamp));
    }
    async repairLegacyYoutubeDuration(job) {
        if (job.status !== client_1.VideoTranslateStatus.READY ||
            !job.youtubeVideoId ||
            !job.youtubeUrl ||
            job.durationSec == null) {
            return job;
        }
        const knownFallbackDurations = new Set([
            this.maxSecondsFree(),
            this.maxSecondsPremium(),
        ]);
        if (!knownFallbackDurations.has(job.durationSec))
            return job;
        const transcriptDuration = this.inferTranscriptDuration(this.parseSegments(job.segmentsJson));
        if (transcriptDuration >= job.durationSec - 2)
            return job;
        const durationSec = await this.fetchYoutubeWatchDuration(job.youtubeUrl);
        if (durationSec == null || durationSec === job.durationSec)
            return job;
        await this.prisma.videoTranslateJob.update({
            where: { id: job.id },
            data: { durationSec },
        });
        return { ...job, durationSec };
    }
    resolveYtDlpPath() {
        const configured = this.config.get('YT_DLP_PATH')?.trim();
        if (configured && (0, fs_1.existsSync)(configured))
            return configured;
        for (const candidate of this.localToolCandidates('yt-dlp.exe', 'yt-dlp')) {
            if ((0, fs_1.existsSync)(candidate))
                return candidate;
        }
        return 'yt-dlp';
    }
    resolveFfmpegPath() {
        const configured = this.config.get('FFMPEG_PATH')?.trim();
        if (configured && (0, fs_1.existsSync)(configured))
            return configured;
        if (ffmpeg_static_1.default && (0, fs_1.existsSync)(ffmpeg_static_1.default)) {
            return ffmpeg_static_1.default;
        }
        for (const candidate of this.localToolCandidates('ffmpeg.exe', 'ffmpeg')) {
            if ((0, fs_1.existsSync)(candidate))
                return candidate;
        }
        return 'ffmpeg';
    }
    ytDlpConnectionArgs(includeProxy = true) {
        const args = [];
        const configuredProxy = this.config.get('YT_DLP_PROXY')?.trim();
        const proxy = includeProxy
            ? this.normalizeYtDlpProxy(configuredProxy)
            : null;
        const cookiesPath = this.resolveYtDlpCookiesPath();
        const forceIpv4 = this.config.get('YT_DLP_FORCE_IPV4')?.trim().toLowerCase() ===
            'true';
        const extractorArgs = this.config.get('YT_DLP_EXTRACTOR_ARGS')?.trim() ||
            'youtube:player_client=android,tv,web';
        if (proxy) {
            args.push('--proxy', proxy);
        }
        else if (includeProxy && configuredProxy) {
            this.logger.warn('YT_DLP_PROXY không đúng định dạng; sẽ thử kết nối trực tiếp.');
        }
        if (cookiesPath) {
            args.push('--cookies', cookiesPath);
        }
        else {
            this.logger.warn('YT_DLP cookies chưa cấu hình — IP server dễ bị YouTube chặn bot. ' +
                'Set YT_DLP_COOKIES_PATH hoặc YT_DLP_COOKIES_BASE64.');
        }
        if (forceIpv4)
            args.push('--force-ipv4');
        if (extractorArgs)
            args.push('--extractor-args', extractorArgs);
        return args;
    }
    hasConfiguredYtDlpProxy() {
        return Boolean(this.config.get('YT_DLP_PROXY')?.trim());
    }
    normalizedYtDlpProxy() {
        return this.normalizeYtDlpProxy(this.config.get('YT_DLP_PROXY')?.trim());
    }
    normalizeYtDlpProxy(raw) {
        let value = raw?.trim();
        if (!value)
            return null;
        if (/^YT_DLP_PROXY\s*=/i.test(value)) {
            value = value.replace(/^YT_DLP_PROXY\s*=\s*/i, '').trim();
        }
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1).trim();
        }
        if (!value || /[\r\n\t ]/.test(value))
            return null;
        const prefixedProviderFormat = value.match(/^(https?|socks4|socks5|socks5h):\/\/([^:/@]+):([^:/@]+):([^:/@]+):(\d+)$/i);
        if (prefixedProviderFormat) {
            const [, scheme, username, password, host, port] = prefixedProviderFormat;
            value = `${scheme.toLowerCase()}://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
        }
        else if (!/^[a-z][a-z\d+.-]*:\/\//i.test(value)) {
            const providerFormat = value.match(/^([^:@/]+):(\d+):([^:]+):(.+)$/);
            if (providerFormat) {
                const [, host, port, username, password] = providerFormat;
                value = `http://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
            }
            else {
                value = `http://${value}`;
            }
        }
        try {
            const parsed = new URL(value);
            const supportedProtocols = new Set([
                'http:',
                'https:',
                'socks4:',
                'socks5:',
                'socks5h:',
            ]);
            if (!supportedProtocols.has(parsed.protocol) ||
                !parsed.hostname ||
                parsed.search ||
                parsed.hash ||
                (parsed.pathname && parsed.pathname !== '/')) {
                return null;
            }
            return value;
        }
        catch {
            return null;
        }
    }
    isProxyParseError(detail) {
        const lower = detail.toLowerCase();
        return lower.includes('failed to parse') || lower.includes('invalid proxy');
    }
    ytDlpInvalidProxyError(detail, directRetryFailed = false) {
        return ('YT_DLP_PROXY không hợp lệ. Hãy dùng định dạng ' +
            'http://user:password@host:port (không đặt trong dấu ngoặc kép). ' +
            `${directRetryFailed ? 'Kết nối trực tiếp cũng thất bại' : 'Chi tiết'}: ${detail.slice(0, 350)}`);
    }
    resolveYtDlpCookiesPath() {
        const configured = this.config.get('YT_DLP_COOKIES_PATH')?.trim();
        if (configured) {
            if ((0, fs_1.existsSync)(configured))
                return configured;
            this.logger.warn(`YT_DLP_COOKIES_PATH không tồn tại: ${configured}`);
        }
        const base64 = this.config.get('YT_DLP_COOKIES_BASE64')?.trim();
        if (!base64)
            return null;
        try {
            const content = Buffer.from(base64, 'base64').toString('utf8').trim();
            if (!content || content.length < 20) {
                this.logger.warn('YT_DLP_COOKIES_BASE64 rỗng hoặc không hợp lệ');
                return null;
            }
            const outDir = (0, path_1.join)(process.cwd(), 'storage');
            (0, fs_1.mkdirSync)(outDir, { recursive: true });
            const outPath = (0, path_1.join)(outDir, 'youtube-cookies.txt');
            (0, fs_1.writeFileSync)(outPath, `${content}\n`, { encoding: 'utf8', mode: 0o600 });
            return outPath;
        }
        catch (error) {
            this.logger.warn(`Không ghi được cookies từ YT_DLP_COOKIES_BASE64: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    ytDlpUserFacingError(detail) {
        const lower = detail.toLowerCase();
        if (this.isProxyParseError(detail)) {
            return this.ytDlpInvalidProxyError(detail);
        }
        if (lower.includes('sign in to confirm') ||
            lower.includes("you're not a bot") ||
            lower.includes('not a bot') ||
            lower.includes('cookies-from-browser')) {
            return ('YouTube chặn tải audio từ server (bot check). ' +
                'Cần cấu hình cookies YouTube trên production: ' +
                'YT_DLP_COOKIES_PATH hoặc YT_DLP_COOKIES_BASE64. ' +
                'Xem backend/tools/README.md.');
        }
        return `Không tải được audio YouTube. Chi tiết: ${detail.slice(0, 500)}`;
    }
    commandErrorDetail(error) {
        const commandError = error;
        const stderr = this.commandOutput(commandError?.stderr);
        const stdout = this.commandOutput(commandError?.stdout);
        const fallback = error instanceof Error ? error.message : String(error);
        const output = stderr || stdout || fallback;
        const lines = output
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        const explicitError = lines.filter((line) => /^error:/i.test(line)).at(-1);
        return this.redactCommandSecrets((explicitError || lines.at(-1) || output).replace(/\s+/g, ' ').trim());
    }
    commandErrorLog(error) {
        const commandError = error;
        return this.redactCommandSecrets(this.commandOutput(commandError?.stderr) ||
            this.commandOutput(commandError?.stdout) ||
            (error instanceof Error ? error.message : String(error)));
    }
    redactCommandSecrets(value) {
        const configuredProxy = this.config.get('YT_DLP_PROXY')?.trim();
        const normalizedProxy = this.normalizeYtDlpProxy(configuredProxy);
        return [configuredProxy, normalizedProxy]
            .filter((proxy) => Boolean(proxy))
            .reduce((redacted, proxy) => redacted.split(proxy).join('[redacted proxy]'), value);
    }
    commandOutput(output) {
        return output ? String(output).trim() : '';
    }
    localToolCandidates(...names) {
        const projectRoots = [
            process.cwd(),
            (0, path_1.join)(__dirname, '..', '..'),
            (0, path_1.join)(__dirname, '..', '..', '..'),
        ];
        return Array.from(new Set(projectRoots.flatMap((root) => names.map((name) => (0, path_1.join)(root, 'tools', name)))));
    }
    async runFfmpeg(args) {
        const ffmpeg = this.resolveFfmpegPath();
        try {
            await execFileAsync(ffmpeg, args, {
                timeout: 180_000,
                maxBuffer: 10 * 1024 * 1024,
            });
        }
        catch (error) {
            const detail = this.commandErrorDetail(error);
            this.logger.error(`ffmpeg failed: ${this.commandErrorLog(error)}`);
            throw new common_1.ServiceUnavailableException(`ffmpeg lỗi: ${detail.slice(0, 600)}`);
        }
    }
    serializeJob(job) {
        return {
            id: job.id,
            youtubeVideoId: job.youtubeVideoId,
            youtubeUrl: job.youtubeUrl,
            originalFilename: job.originalFilename ?? null,
            mediaUrl: job.mediaUrl ?? null,
            title: job.title,
            thumbnailUrl: job.thumbnailUrl,
            durationSec: job.durationSec,
            status: job.status,
            source: job.source,
            errorMessage: job.errorMessage,
            segments: this.parseSegments(job.segmentsJson),
            dubbedAudioUrl: job.dubbedAudioUrl,
            pipelineVersion: job.pipelineVersion ?? 1,
            fromCache: job.fromCache,
            createdAt: job.createdAt.toISOString(),
            updatedAt: job.updatedAt.toISOString(),
            completedAt: job.completedAt?.toISOString() ?? null,
        };
    }
    parseSegments(value) {
        if (!value || !Array.isArray(value))
            return [];
        return value
            .map((item) => {
            if (!item || typeof item !== 'object')
                return null;
            const row = item;
            const start = Number(row.start);
            const end = Number(row.end);
            const en = typeof row.en === 'string' ? row.en : '';
            const vi = typeof row.vi === 'string' ? row.vi : '';
            const words = Array.isArray(row.words)
                ? row.words
                    .map((word) => {
                    if (!word || typeof word !== 'object')
                        return null;
                    const value = word;
                    const text = typeof value.text === 'string' ? value.text : '';
                    const wordStart = Number(value.start);
                    const wordEnd = Number(value.end);
                    if (!text || !Number.isFinite(wordStart))
                        return null;
                    return {
                        text,
                        start: wordStart,
                        end: Number.isFinite(wordEnd)
                            ? Math.max(wordStart, wordEnd)
                            : wordStart + 0.12,
                    };
                })
                    .filter((word) => word != null)
                : [];
            if (!Number.isFinite(start) || !en)
                return null;
            return {
                start,
                end: Number.isFinite(end) ? end : start + 2,
                en,
                vi,
                ...(words.length ? { words } : {}),
            };
        })
            .filter((item) => item != null);
    }
    resolvePremium(user) {
        if (!user.isPremium)
            return false;
        if (user.premiumExpiresAt && user.premiumExpiresAt <= new Date()) {
            return false;
        }
        return true;
    }
    usageDate() {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }
    nextResetAt() {
        const date = this.usageDate();
        date.setUTCDate(date.getUTCDate() + 1);
        return date;
    }
    maxSecondsFree() {
        const raw = Number(this.config.get('VIDEO_TRANSLATE_MAX_SECONDS_FREE'));
        return Number.isFinite(raw) && raw > 0 ? raw : exports.DEFAULT_MAX_SECONDS_FREE;
    }
    maxSecondsPremium() {
        const raw = Number(this.config.get('VIDEO_TRANSLATE_MAX_SECONDS_PREMIUM'));
        return Number.isFinite(raw) && raw > 0 ? raw : exports.DEFAULT_MAX_SECONDS_PREMIUM;
    }
    translationBatchSize() {
        return this.boundedConfigNumber('VIDEO_TRANSLATE_BATCH_SIZE', DEFAULT_TRANSLATION_BATCH_SIZE, 6, 40);
    }
    translationConcurrency() {
        return this.boundedConfigNumber('VIDEO_TRANSLATE_CONCURRENCY', DEFAULT_TRANSLATION_CONCURRENCY, 1, 6);
    }
    boundedConfigNumber(key, fallback, min, max) {
        const configured = this.config.get(key);
        if (configured == null || String(configured).trim() === '')
            return fallback;
        const raw = Number(configured);
        if (!Number.isFinite(raw))
            return fallback;
        return Math.min(max, Math.max(min, Math.floor(raw)));
    }
    async getTodayUsage(userId) {
        const usage = await this.prisma.videoTranslateDailyUsage.findUnique({
            where: {
                userId_usageDate: {
                    userId,
                    usageDate: this.usageDate(),
                },
            },
            select: { videoCount: true },
        });
        return usage?.videoCount ?? 0;
    }
    async assertAndReserveQuota(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { isPremium: true, premiumExpiresAt: true },
        });
        if (this.resolvePremium(user))
            return;
        const usageDate = this.usageDate();
        const reserved = await this.prisma.$transaction(async (tx) => {
            await tx.videoTranslateDailyUsage.upsert({
                where: { userId_usageDate: { userId, usageDate } },
                create: { userId, usageDate, videoCount: 0 },
                update: {},
            });
            const updated = await tx.$queryRaw `
        UPDATE video_translate_daily_usage
        SET video_count = video_count + 1, updated_at = NOW()
        WHERE user_id = ${userId}
          AND usage_date = ${usageDate}
          AND video_count < ${exports.FREE_VIDEO_TRANSLATE_PER_DAY}
        RETURNING video_count
      `;
            return updated[0] ?? null;
        });
        if (!reserved) {
            throw new common_1.ForbiddenException({
                statusCode: 403,
                message: 'Bạn đã hết 3 video miễn phí hôm nay. Nâng cấp Premium để dịch không giới hạn.',
                code: 'VIDEO_TRANSLATE_QUOTA_EXCEEDED',
            });
        }
    }
    async releaseQuotaReservation(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { isPremium: true, premiumExpiresAt: true },
        });
        if (!user || this.resolvePremium(user))
            return;
        const usageDate = this.usageDate();
        await this.prisma.$executeRaw `
      UPDATE video_translate_daily_usage
      SET video_count = GREATEST(video_count - 1, 0), updated_at = NOW()
      WHERE user_id = ${userId} AND usage_date = ${usageDate}
    `;
    }
    ensureOpenAi() {
        if (!this.openai) {
            throw new common_1.ServiceUnavailableException('OPENAI_API_KEY chưa cấu hình — không thể dịch video');
        }
    }
};
exports.VideoTranslateService = VideoTranslateService;
exports.VideoTranslateService = VideoTranslateService = VideoTranslateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], VideoTranslateService);
//# sourceMappingURL=video-translate.service.js.map