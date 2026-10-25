import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { findPublicVideo } from '../catalog/public-videos';
import {
  VideoTranslateService,
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

  constructor(private readonly videoTranslate: VideoTranslateService) {}

  getTranscript(id: string): FeaturedVideoTranscript {
    this.findVideo(id);
    const existing = this.lessons.get(id);
    if (existing) return existing;
    const path = this.cachePath(id);
    if (existsSync(path)) {
      try {
        const segments = JSON.parse(
          readFileSync(path, 'utf8'),
        ) as VideoSegment[];
        if (
          Array.isArray(segments) &&
          segments.length &&
          segments.every(
            (segment, index) =>
              Number.isFinite(segment.start) &&
              Number.isFinite(segment.end) &&
              segment.end > segment.start &&
              segment.start >= (segments[index - 1]?.start ?? 0) &&
              typeof segment.en === 'string' &&
              typeof segment.vi === 'string',
          )
        ) {
          const result: FeaturedVideoTranscript = {
            status: 'READY',
            segments,
            errorMessage: null,
          };
          this.lessons.set(id, result);
          return result;
        }
      } catch {
        // A damaged cache can be regenerated on the next explicit request.
      }
    }
    return { status: 'PENDING', segments: [], errorMessage: null };
  }

  prepareTranscript(id: string): FeaturedVideoTranscript {
    const video = this.findVideo(id);
    const existing = this.getTranscript(id);
    if (existing.status === 'READY' || existing.status === 'PROCESSING')
      return existing;
    const state: FeaturedVideoTranscript = {
      status: 'PROCESSING',
      segments: [],
      errorMessage: null,
    };
    this.lessons.set(id, state);
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
      }
    })();
    return state;
  }

  private findVideo(id: string) {
    const video = findPublicVideo(id);
    if (!video) throw new NotFoundException('Không tìm thấy bài học video');
    return video;
  }

  private cachePath(id: string) {
    return join(
      process.cwd(),
      'storage',
      'featured-videos',
      id,
      'transcript-v2.json',
    );
  }
}
