import { Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { gunzipSync } from 'zlib';
import { PodcastCatalogService } from '../podcast/podcast-catalog.service';
import {
  VideoTranslateService,
  TRANSCRIPT_RULES,
  type VideoSegment,
} from './video-translate.service';

export interface FeaturedVideoTranscript {
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  segments: VideoSegment[];
  errorMessage: string | null;
}

@Injectable()
export class FeaturedVideoService {
  private readonly logger = new Logger(FeaturedVideoService.name);
  private readonly lessons = new Map<string, FeaturedVideoTranscript>();

  constructor(
    private readonly videoTranslate: VideoTranslateService,
    private readonly catalog: PodcastCatalogService,
  ) {}

  async getTranscript(id: string): Promise<FeaturedVideoTranscript> {
    await this.catalog.findVideo(id);
    return this.readTranscript(id);
  }

  private readTranscript(id: string): FeaturedVideoTranscript {
    const existing = this.lessons.get(id);
    if (existing?.status === 'READY' || existing?.status === 'PROCESSING')
      return existing;
    // storage is optional on a fresh Railway container; the deployment also carries
    // the verified transcripts outside the public/static directories.
    for (const path of [
      this.cachePath(id),
      this.cachePath(id, 2),
      join(
        __dirname,
        '..',
        '..',
        'resources',
        'podcast-transcripts',
        `${id}.json.gz`,
      ),
    ]) {
      if (!existsSync(path)) continue;
      try {
        const contents = path.endsWith('.gz')
          ? gunzipSync(readFileSync(path), {
              maxOutputLength: 16 * 1024 * 1024,
            }).toString('utf8')
          : readFileSync(path, 'utf8');
        const segments = JSON.parse(contents) as VideoSegment[];
        if (
          Array.isArray(segments) &&
          segments.length &&
          segments.every(
            (segment, index) =>
              Number.isFinite(segment.start) &&
              Number.isFinite(segment.end) &&
              segment.end > segment.start &&
              segment.start >= (segments[index - 1]?.end ?? 0) - 0.001 &&
              typeof segment.en === 'string' &&
              typeof segment.vi === 'string' &&
              segment.en.trim().length > 0 &&
              segment.vi.trim().length > 0 &&
              (!segment.words ||
                segment.words.every(
                  (word) =>
                    Number.isFinite(word.start) &&
                    Number.isFinite(word.end) &&
                    word.end > word.start &&
                    word.start >= segment.start - 0.001 &&
                    word.end <= segment.end + 0.001,
                )) &&
              segment.en.split(/\s+/).filter(Boolean).length <=
                TRANSCRIPT_RULES.maxWords &&
              (segment.end - segment.start <= TRANSCRIPT_RULES.maxDurationSec ||
                segment.en.split(/\s+/).filter(Boolean).length < 8),
          )
        ) {
          const result: FeaturedVideoTranscript = {
            status: 'READY',
            segments,
            errorMessage: null,
          };
          this.lessons.set(id, result);
          this.saveStatus(id, 'READY');
          return result;
        }
      } catch {
        // A damaged cache can be regenerated on the next explicit request.
      }
    }
    return existing ?? { status: 'PENDING', segments: [], errorMessage: null };
  }

  async prepareTranscript(id: string): Promise<FeaturedVideoTranscript> {
    const video = await this.catalog.findVideo(id);
    const existing = this.readTranscript(id);
    if (existing.status === 'READY' || existing.status === 'PROCESSING')
      return existing;
    const state: FeaturedVideoTranscript = {
      status: 'PROCESSING',
      segments: [],
      errorMessage: null,
    };
    this.lessons.set(id, state);
    await this.catalog.setTranscriptStatus(id, 'PROCESSING').catch(() => {});
    void (async () => {
      try {
        const directory = join(process.cwd(), 'storage', 'featured-videos', id);
        mkdirSync(directory, { recursive: true });
        const segments = await this.videoTranslate.prepareFeaturedTranscript(
          id,
          video.duration,
          directory,
        );
        if (!segments.length) throw new Error('Empty transcript');
        writeFileSync(this.cachePath(id), JSON.stringify(segments), 'utf8');
        this.lessons.set(id, { status: 'READY', segments, errorMessage: null });
        this.saveStatus(id, 'READY');
      } catch (error) {
        this.logger.warn(
          `Featured video ${id}: ${error instanceof Error ? error.message : String(error)}`,
        );
        this.lessons.set(id, {
          status: 'FAILED',
          segments: [],
          errorMessage:
            'Chưa tải được phụ đề song ngữ. Bạn có thể tiếp tục xem video hoặc thử lại.',
        });
        this.saveStatus(id, 'FAILED');
      }
    })();
    return state;
  }

  private saveStatus(id: string, status: string) {
    void this.catalog.setTranscriptStatus(id, status).catch(() => {});
  }

  private cachePath(id: string, version = 3) {
    return join(
      process.cwd(),
      'storage',
      'featured-videos',
      id,
      `transcript-v${version}.json`,
    );
  }
}
