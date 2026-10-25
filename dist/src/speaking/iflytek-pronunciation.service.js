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
var IflytekPronunciationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IflytekPronunciationService = void 0;
exports.parseIflytekPronunciationXml = parseIflytekPronunciationXml;
exports.buildIflytekAuthUrl = buildIflytekAuthUrl;
const node_child_process_1 = require("node:child_process");
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const ws_1 = __importDefault(require("ws"));
const DEFAULT_IFLYTEK_ISE_URL = 'wss://ise-api-sg.xf-yun.com/v2/ise';
const DEFAULT_TIMEOUT_MS = 25_000;
const DEFAULT_FRAME_BYTES = 1_280;
const DEFAULT_FRAME_INTERVAL_MS = 40;
const MAX_FRAME_BYTES = 19_200;
function clampScore(value) {
    if (value == null || value === '')
        return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        return null;
    return Math.round(Math.max(0, Math.min(100, parsed)) * 100) / 100;
}
function parsePosition(value) {
    if (value == null || value === '')
        return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
function decodeXmlEntities(value) {
    return value
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}
function parseAttributes(source) {
    const attributes = {};
    const matcher = /([A-Za-z_][\w:-]*)=(?:"([^"]*)"|'([^']*)')/g;
    let match;
    while ((match = matcher.exec(source))) {
        attributes[match[1]] = decodeXmlEntities(match[2] ?? match[3] ?? '');
    }
    return attributes;
}
function parseIflytekPronunciationXml(xml) {
    const scoreKeys = [
        'phone_score',
        'accuracy_score',
        'fluency_score',
        'integrity_score',
        'standard_score',
        'tone_score',
        'emotion_score',
        'total_score',
    ];
    const candidates = [];
    const words = [];
    const tagMatcher = /<([A-Za-z_][\w:-]*)\b([^>]*)>/g;
    let tagMatch;
    while ((tagMatch = tagMatcher.exec(xml))) {
        const tagName = tagMatch[1].toLowerCase();
        const attributes = parseAttributes(tagMatch[2]);
        const scoreCount = scoreKeys.filter((key) => attributes[key] != null).length;
        if (scoreCount)
            candidates.push({ attributes, scoreCount });
        if (tagName === 'word' && words.length < 250) {
            words.push({
                content: attributes.content ?? '',
                score: clampScore(attributes.total_score ??
                    attributes.phone_score ??
                    attributes.accuracy_score),
                beginPosition: parsePosition(attributes.beg_pos),
                endPosition: parsePosition(attributes.end_pos),
            });
        }
    }
    const best = candidates.sort((left, right) => {
        if (right.scoreCount !== left.scoreCount) {
            return right.scoreCount - left.scoreCount;
        }
        const rightTotal = clampScore(right.attributes.total_score) ?? -1;
        const leftTotal = clampScore(left.attributes.total_score) ?? -1;
        return rightTotal - leftTotal;
    })[0]?.attributes;
    if (!best) {
        throw new Error('iFLYTEK returned XML without pronunciation scores');
    }
    const accuracy = clampScore(best.accuracy_score);
    const phone = clampScore(best.phone_score);
    return {
        pronunciation: phone ?? accuracy ?? clampScore(best.total_score),
        accuracy,
        fluency: clampScore(best.fluency_score),
        completeness: clampScore(best.integrity_score),
        standard: clampScore(best.standard_score),
        tone: clampScore(best.tone_score),
        emotion: clampScore(best.emotion_score),
        total: clampScore(best.total_score),
        words,
    };
}
function buildIflytekAuthUrl(input) {
    const url = new URL(input.endpoint);
    const date = (input.now ?? new Date()).toUTCString();
    const signatureOrigin = [
        `host: ${url.host}`,
        `date: ${date}`,
        `GET ${url.pathname} HTTP/1.1`,
    ].join('\n');
    const signature = (0, node_crypto_1.createHmac)('sha256', input.apiSecret)
        .update(signatureOrigin)
        .digest('base64');
    const authorizationOrigin = [
        `api_key="${input.apiKey}"`,
        'algorithm="hmac-sha256"',
        'headers="host date request-line"',
        `signature="${signature}"`,
    ].join(', ');
    url.searchParams.set('authorization', Buffer.from(authorizationOrigin).toString('base64'));
    url.searchParams.set('date', date);
    url.searchParams.set('host', url.host);
    return url.toString();
}
let IflytekPronunciationService = IflytekPronunciationService_1 = class IflytekPronunciationService {
    config;
    logger = new common_1.Logger(IflytekPronunciationService_1.name);
    constructor(config) {
        this.config = config;
    }
    isConfigured() {
        if (this.config
            .get('IFLYTEK_PRONUNCIATION_ENABLED')
            ?.trim()
            .toLowerCase() === 'false') {
            return false;
        }
        return Boolean(this.config.get('IFLYTEK_APP_ID')?.trim() &&
            this.config.get('IFLYTEK_API_KEY')?.trim() &&
            this.config.get('IFLYTEK_API_SECRET')?.trim());
    }
    async assess(input) {
        if (!this.isConfigured())
            return null;
        const referenceText = input.referenceText.replace(/\s+/g, ' ').trim();
        if (!referenceText)
            return null;
        const pcm = await this.convertToPcm(input.audio);
        const category = Buffer.byteLength(referenceText, 'utf8') > 280
            ? 'read_chapter'
            : 'read_sentence';
        return this.evaluatePcm(pcm, referenceText, category);
    }
    getRequiredConfig(key) {
        const value = this.config.get(key)?.trim();
        if (!value)
            throw new Error(`${key} is not configured`);
        return value;
    }
    async convertToPcm(audio) {
        const executable = this.config.get('FFMPEG_PATH')?.trim() || ffmpeg_static_1.default;
        if (!executable)
            throw new Error('FFmpeg executable is unavailable');
        return new Promise((resolve, reject) => {
            const child = (0, node_child_process_1.spawn)(executable, [
                '-hide_banner',
                '-loglevel',
                'error',
                '-i',
                'pipe:0',
                '-vn',
                '-ac',
                '1',
                '-ar',
                '16000',
                '-f',
                's16le',
                'pipe:1',
            ], { windowsHide: true });
            const output = [];
            const errors = [];
            const timeout = setTimeout(() => {
                child.kill();
                reject(new Error('FFmpeg audio conversion timed out'));
            }, 15_000);
            child.stdout.on('data', (chunk) => output.push(chunk));
            child.stderr.on('data', (chunk) => errors.push(chunk));
            child.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
            child.on('close', (code) => {
                clearTimeout(timeout);
                if (code !== 0) {
                    reject(new Error(`FFmpeg audio conversion failed: ${Buffer.concat(errors).toString('utf8').trim()}`));
                    return;
                }
                const pcm = Buffer.concat(output);
                if (!pcm.length) {
                    reject(new Error('FFmpeg produced empty PCM audio'));
                    return;
                }
                resolve(pcm);
            });
            child.stdin.end(audio);
        });
    }
    async evaluatePcm(pcm, referenceText, category) {
        const endpoint = this.config.get('IFLYTEK_ISE_URL')?.trim() ||
            DEFAULT_IFLYTEK_ISE_URL;
        const apiKey = this.getRequiredConfig('IFLYTEK_API_KEY');
        const apiSecret = this.getRequiredConfig('IFLYTEK_API_SECRET');
        const appId = this.getRequiredConfig('IFLYTEK_APP_ID');
        const timeoutMs = this.readPositiveInteger('IFLYTEK_ISE_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
        const frameBytes = this.readFrameBytes();
        const frameIntervalMs = this.readPositiveInteger('IFLYTEK_ISE_FRAME_INTERVAL_MS', DEFAULT_FRAME_INTERVAL_MS);
        const authUrl = buildIflytekAuthUrl({
            endpoint,
            apiKey,
            apiSecret,
        });
        return new Promise((resolve, reject) => {
            const socket = new ws_1.default(authUrl);
            let settled = false;
            let sid = null;
            const finish = (outcome) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timeout);
                if (socket.readyState === ws_1.default.OPEN)
                    socket.close();
                if ('error' in outcome)
                    reject(outcome.error);
                else
                    resolve(outcome.result);
            };
            const timeout = setTimeout(() => finish({ error: new Error('iFLYTEK assessment timed out') }), timeoutMs);
            socket.on('open', () => {
                socket.send(JSON.stringify({
                    common: { app_id: appId },
                    business: {
                        aue: 'raw',
                        auf: 'audio/L16;rate=16000',
                        category,
                        cmd: 'ssb',
                        ent: 'en_vip',
                        sub: 'ise',
                        text: `\uFEFF[content]${referenceText}`,
                        tte: 'utf-8',
                        ttp_skip: true,
                        rstcd: 'utf8',
                        rst: 'entirety',
                        ise_unite: '1',
                        plev: '0',
                        extra_ability: 'multi_dimension;pitch;syll_phone_err_msg',
                    },
                    data: { status: 0 },
                }));
                void this.sendAudioFrames(socket, pcm, frameBytes, frameIntervalMs).catch((error) => {
                    finish({
                        error: error instanceof Error ? error : new Error(String(error)),
                    });
                });
            });
            socket.on('message', (payload) => {
                let message;
                try {
                    const messageText = Buffer.isBuffer(payload)
                        ? payload.toString('utf8')
                        : Array.isArray(payload)
                            ? Buffer.concat(payload).toString('utf8')
                            : Buffer.from(payload).toString('utf8');
                    message = JSON.parse(messageText);
                }
                catch {
                    finish({ error: new Error('iFLYTEK returned invalid JSON') });
                    return;
                }
                if (message.sid)
                    sid = message.sid;
                if (message.code != null && message.code !== 0) {
                    finish({
                        error: new Error(`iFLYTEK error ${message.code}: ${message.message ?? 'unknown error'}${sid ? ` (sid: ${sid})` : ''}`),
                    });
                    return;
                }
                if (message.data?.status !== 2 || !message.data.data)
                    return;
                try {
                    const xml = Buffer.from(message.data.data, 'base64').toString('utf8');
                    const parsed = parseIflytekPronunciationXml(xml);
                    const result = {
                        provider: 'iflytek',
                        sid,
                        category,
                        ...parsed,
                        raw: {
                            provider: 'iflytek',
                            sid,
                            category,
                            scores: {
                                pronunciation: parsed.pronunciation,
                                accuracy: parsed.accuracy,
                                fluency: parsed.fluency,
                                completeness: parsed.completeness,
                                standard: parsed.standard,
                                tone: parsed.tone,
                                emotion: parsed.emotion,
                                total: parsed.total,
                            },
                            words: parsed.words,
                            xmlBytes: Buffer.byteLength(xml),
                            xmlSha256: (0, node_crypto_1.createHash)('sha256').update(xml).digest('hex'),
                        },
                    };
                    finish({ result });
                }
                catch (error) {
                    finish({
                        error: error instanceof Error ? error : new Error(String(error)),
                    });
                }
            });
            socket.on('error', (error) => finish({ error }));
            socket.on('close', () => {
                if (!settled) {
                    finish({
                        error: new Error(`iFLYTEK closed the connection before returning a result${sid ? ` (sid: ${sid})` : ''}`),
                    });
                }
            });
        });
    }
    async sendAudioFrames(socket, pcm, frameBytes, intervalMs) {
        const chunks = [];
        for (let offset = 0; offset < pcm.length; offset += frameBytes) {
            chunks.push(pcm.subarray(offset, Math.min(pcm.length, offset + frameBytes)));
        }
        for (let index = 0; index < chunks.length; index += 1) {
            if (socket.readyState !== ws_1.default.OPEN) {
                throw new Error('iFLYTEK WebSocket closed during audio upload');
            }
            const isFirst = index === 0;
            const isLast = index === chunks.length - 1;
            socket.send(JSON.stringify({
                business: {
                    cmd: 'auw',
                    aus: isLast ? 4 : isFirst ? 1 : 2,
                },
                data: {
                    status: isLast ? 2 : 1,
                    data: chunks[index].toString('base64'),
                },
            }));
            if (!isLast && intervalMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, intervalMs));
            }
        }
    }
    readPositiveInteger(key, fallback) {
        const value = Number(this.config.get(key));
        return Number.isInteger(value) && value > 0 ? value : fallback;
    }
    readFrameBytes() {
        return Math.min(MAX_FRAME_BYTES, this.readPositiveInteger('IFLYTEK_ISE_FRAME_BYTES', DEFAULT_FRAME_BYTES));
    }
};
exports.IflytekPronunciationService = IflytekPronunciationService;
exports.IflytekPronunciationService = IflytekPronunciationService = IflytekPronunciationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], IflytekPronunciationService);
//# sourceMappingURL=iflytek-pronunciation.service.js.map