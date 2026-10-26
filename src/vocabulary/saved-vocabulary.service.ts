import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type SavedVocabularySource,
  type SavedVocabularyWord,
} from '@prisma/client';
import { loadCatalogLessons } from '../catalog/content-catalog';
import { PodcastCatalogService } from '../podcast/podcast-catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import { FeaturedVideoService } from '../video-translate/featured-video.service';
import {
  ReviewSavedVocabularyDto,
  SaveVocabularyDto,
  SavedVocabularyQueryDto,
  VocabularySourceDto,
} from './dto/saved-vocabulary.dto';
import { scheduleReview } from './vocabulary-srs';
import { vocabularyKey, vocabularySenseKey } from './vocabulary-key';

type WordWithSources = SavedVocabularyWord & {
  sources: SavedVocabularySource[];
};
type Segment = { en: string; vi: string; start: number; end: number };

@Injectable()
export class SavedVocabularyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featured: FeaturedVideoService,
    private readonly catalog: PodcastCatalogService,
  ) {}

  private where(
    userId: string,
    query: SavedVocabularyQueryDto,
  ): Prisma.SavedVocabularyWordWhereInput {
    return {
      userId,
      ...(query.wordId ? { id: query.wordId } : {}),
      ...(query.status === 'mastered' ? { status: 'MASTERED' } : {}),
      ...(query.status === 'due' ? { nextReviewAt: { lte: new Date() } } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { word: { contains: query.search.trim(), mode: 'insensitive' } },
              {
                meaning: { contains: query.search.trim(), mode: 'insensitive' },
              },
            ],
          }
        : {}),
      ...(query.source
        ? {
            sources: {
              some: { sourceKey: { startsWith: `${query.source}:` } },
            },
          }
        : {}),
    };
  }

  private publicWord(word: WordWithSources) {
    const {
      userId: _owner,
      wordKey: _wordKey,
      senseKey: _senseKey,
      lastReviewRequestId: _request,
      ...result
    } = word;
    return result;
  }

  async list(userId: string, query: SavedVocabularyQueryDto = {}) {
    const [words, total, mastered, due, sources] = await Promise.all([
      this.prisma.savedVocabularyWord.findMany({
        where: this.where(userId, query),
        orderBy:
          query.sort === 'alphabetical'
            ? { word: 'asc' }
            : { createdAt: 'desc' },
        include: { sources: { orderBy: { createdAt: 'asc' } } },
      }),
      this.prisma.savedVocabularyWord.count({ where: { userId } }),
      this.prisma.savedVocabularyWord.count({
        where: { userId, status: 'MASTERED' },
      }),
      this.prisma.savedVocabularyWord.count({
        where: { userId, nextReviewAt: { lte: new Date() } },
      }),
      this.prisma.savedVocabularySource.findMany({
        where: { word: { userId } },
        distinct: ['sourceType', 'sourceId'],
        select: { sourceType: true, sourceId: true, title: true },
        orderBy: { title: 'asc' },
      }),
    ]);
    return {
      words: words.map((word) => this.publicWord(word)),
      stats: { total, mastered, due },
      sources: sources.map((source) => ({
        key: `${source.sourceType}:${source.sourceId}`,
        title: source.title,
      })),
    };
  }

  async session(userId: string, query: SavedVocabularyQueryDto = {}) {
    // Freeze the selected queue. Manual review deliberately has no due-date condition.
    const words = await this.prisma.savedVocabularyWord.findMany({
      where: this.where(userId, query),
      orderBy:
        query.status === 'due'
          ? { nextReviewAt: 'asc' }
          : { createdAt: 'desc' },
      include: { sources: { orderBy: { createdAt: 'asc' } } },
    });
    return { words: words.map((word) => this.publicWord(word)) };
  }

  async resolveSource(userId: string, source: VocabularySourceDto) {
    let title: string;
    let segments: Segment[];
    if (source.type === 'lesson') {
      const catalog = loadCatalogLessons().find(
        (lesson) => lesson.id === source.id,
      );
      if (catalog) {
        title = catalog.title;
        segments = catalog.sentences.map((s) => ({
          en: s.english,
          vi: s.vietnamese,
          start: s.time_start,
          end: s.time_end,
        }));
      } else {
        const lesson = await this.prisma.lesson.findUnique({
          where: { id: source.id },
          include: { transcripts: { orderBy: { orderIndex: 'asc' } } },
        });
        if (!lesson)
          throw new NotFoundException(
            'Bài học nguồn không còn khả dụng. Từ đã lưu vẫn được giữ lại.',
          );
        title = lesson.title;
        segments = lesson.transcripts.map((s) => ({
          en: s.englishText,
          vi: s.vietnamese,
          start: s.startTime,
          end: s.endTime,
        }));
      }
    } else if (source.type === 'featured-video') {
      const video = await this.catalog.findVideo(source.id);
      if (!video)
        throw new NotFoundException('Không tìm thấy bài học video nguồn.');
      title = video.title;
      segments = (await this.featured.getTranscript(source.id)).segments;
    } else {
      const job = await this.prisma.videoTranslateJob.findFirst({
        where: { id: source.id, userId, status: 'READY' },
      });
      if (!job)
        throw new NotFoundException(
          'Bài nghe nguồn không còn khả dụng. Từ đã lưu vẫn được giữ lại.',
        );
      title = job.title || job.originalFilename || 'Bài nghe của tôi';
      segments = Array.isArray(job.segmentsJson)
        ? (job.segmentsJson as unknown as Segment[])
        : [];
    }
    const selected = segments.filter(
      (s) =>
        s.start >= source.startTime - 0.15 && s.end <= source.endTime + 0.15,
    );
    if (
      !selected.length ||
      Math.abs(selected[0].start - source.startTime) > 0.15 ||
      Math.abs(selected.at(-1)!.end - source.endTime) > 0.15
    ) {
      throw new BadRequestException(
        'Không tìm thấy đoạn nghe này trong bài học nguồn.',
      );
    }
    return {
      title,
      sentence: selected.map((s) => s.en).join(' '),
      sentenceTranslation: selected.map((s) => s.vi).join(' '),
      startTime: selected[0].start,
      endTime: selected.at(-1)!.end,
    };
  }

  async save(userId: string, dto: SaveVocabularyDto) {
    if (!dto.source || dto.source.endTime <= dto.source.startTime)
      throw new BadRequestException('Đoạn nghe không hợp lệ.');
    const context = await this.resolveSource(userId, dto.source);
    const token = vocabularyKey(dto.requestedWord).replace(
      /^[^a-z]+|[^a-z'-]+$/g,
      '',
    );
    if (
      !token ||
      !context.sentence
        .toLowerCase()
        .match(/[a-z]+(?:['’-][a-z]+)*/g)
        ?.includes(token)
    ) {
      throw new BadRequestException(
        'Chỉ lưu từ có trong câu của bài học. Hãy chọn lại từ trong transcript.',
      );
    }
    const word = dto.word.trim();
    const sourceKey = `${dto.source.type}:${dto.source.id}:${context.startTime}:${context.endTime}`;
    const result = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.savedVocabularyWord.upsert({
        where: {
          userId_wordKey_senseKey: {
            userId,
            wordKey: vocabularyKey(word),
            senseKey: vocabularySenseKey(dto.meaning),
          },
        },
        create: {
          userId,
          word,
          wordKey: vocabularyKey(word),
          senseKey: vocabularySenseKey(dto.meaning),
          meaning: dto.meaning.trim(),
          phonetic: dto.phonetic,
          partOfSpeech: dto.partOfSpeech,
          definition: dto.definition,
        },
        update: {}, // Saving again must not replace the snapshot or reset learning progress.
      });
      await tx.savedVocabularySource.upsert({
        where: { wordId_sourceKey: { wordId: saved.id, sourceKey } },
        create: {
          wordId: saved.id,
          sourceKey,
          sourceType: dto.source.type,
          sourceId: dto.source.id,
          ...context,
        },
        update: {},
      });
      return tx.savedVocabularyWord.findUniqueOrThrow({
        where: { id: saved.id },
        include: { sources: { orderBy: { createdAt: 'asc' } } },
      });
    });
    return this.publicWord(result);
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.savedVocabularyWord.deleteMany({
      where: { id, userId },
    });
    if (!result.count) throw new NotFoundException('Không tìm thấy từ đã lưu.');
    return { removed: true };
  }

  async review(userId: string, id: string, dto: ReviewSavedVocabularyDto) {
    const word = await this.prisma.savedVocabularyWord.findFirst({
      where: { id, userId },
      include: { sources: true },
    });
    if (!word)
      throw new NotFoundException('Từ này không còn trong sổ từ của bạn.');
    if (word.lastReviewRequestId === dto.requestId)
      return this.publicWord(word);
    if (word.reviewCount !== dto.expectedReviewCount)
      throw new ConflictException(
        'Tiến độ từ đã thay đổi. Hãy mở lại lượt ôn.',
      );
    const schedule = scheduleReview(word, dto.correct, new Date());
    const result = await this.prisma.savedVocabularyWord.updateMany({
      where: { id, userId, reviewCount: dto.expectedReviewCount },
      data: { ...schedule, lastReviewRequestId: dto.requestId },
    });
    if (!result.count) {
      const latest = await this.prisma.savedVocabularyWord.findFirst({
        where: { id, userId },
        include: { sources: true },
      });
      if (latest?.lastReviewRequestId === dto.requestId)
        return this.publicWord(latest);
      throw new ConflictException(
        'Tiến độ từ đã thay đổi. Hãy mở lại lượt ôn.',
      );
    }
    return this.publicWord(
      await this.prisma.savedVocabularyWord.findUniqueOrThrow({
        where: { id },
        include: { sources: true },
      }),
    );
  }

  async replay(userId: string, id: string, sourceId: string) {
    const source = await this.prisma.savedVocabularySource.findFirst({
      where: { id: sourceId, wordId: id, word: { userId } },
    });
    if (!source) throw new NotFoundException('Không tìm thấy nguồn của từ.');
    await this.resolveSource(userId, {
      type: source.sourceType as VocabularySourceDto['type'],
      id: source.sourceId,
      startTime: source.startTime,
      endTime: source.endTime,
    });
    const query = `t=${source.startTime}&end=${source.endTime}`;
    const publicPath =
      source.sourceType === 'featured-video'
        ? (await this.catalog.findVideo(source.sourceId)).lessonPath
        : undefined;
    if (source.sourceType === 'featured-video' && !publicPath)
      throw new NotFoundException('Không tìm thấy bài học video nguồn.');
    const href =
      source.sourceType === 'lesson'
        ? `/bai-hoc/${encodeURIComponent(source.sourceId)}?${query}`
        : source.sourceType === 'featured-video'
          ? `${publicPath}${publicPath!.includes('?') ? '&' : '?'}${query}`
          : `/dich-video?job=${encodeURIComponent(source.sourceId)}&${query}`;
    return { href };
  }
}
