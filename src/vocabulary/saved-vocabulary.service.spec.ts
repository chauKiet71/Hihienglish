import { ConflictException, NotFoundException } from '@nestjs/common';
import { SavedVocabularyService } from './saved-vocabulary.service';
import { vocabularySenseKey } from './vocabulary-key';
import { PODCAST_CHANNELS } from '../catalog/podcast';

jest.mock('../catalog/content-catalog', () => ({
  loadCatalogLessons: () => [
    {
      id: 'lesson-01',
      title: 'Small habits',
      sentences: [
        {
          english: 'Small consistent actions matter.',
          vietnamese: 'Hành động đều đặn rất quan trọng.',
          time_start: 2,
          time_end: 5,
        },
      ],
    },
  ],
}));

describe('personal saved vocabulary', () => {
  const fixture = () => ({
    id: 'word',
    userId: 'alice',
    word: 'consistent',
    wordKey: 'consistent',
    senseKey: 'sense',
    meaning: 'đều đặn',
    status: 'MASTERED' as const,
    reviewCount: 4,
    correctCount: 4,
    streak: 4,
    lapses: 0,
    intervalDays: 18,
    easeFactor: 2.5,
    lastReviewRequestId: null,
    sources: [],
    nextReviewAt: new Date('2099-01-01'),
  });
  function setup() {
    const prisma = {
      savedVocabularyWord: {
        findMany: jest.fn().mockResolvedValue([fixture()]),
        findFirst: jest.fn().mockResolvedValue(fixture()),
        findUniqueOrThrow: jest.fn().mockResolvedValue(fixture()),
        count: jest.fn().mockResolvedValue(1),
        upsert: jest.fn().mockResolvedValue(fixture()),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      savedVocabularySource: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      videoTranslateJob: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
    const featured = { getTranscript: jest.fn() };
    const service = new SavedVocabularyService(
      prisma as never,
      featured as never,
    );
    return { service, prisma, featured };
  }
  it('manually reviews mastered words even when their next review is in the future', async () => {
    const { service, prisma } = setup();
    const session = await service.session('alice', { status: 'mastered' });
    expect(prisma.savedVocabularyWord.findMany.mock.calls[0][0].where).toEqual({
      userId: 'alice',
      status: 'MASTERED',
    });
    expect(session.words).toHaveLength(1);
    expect(session.words[0]).not.toHaveProperty('userId');
  });
  it('all words has no implicit due-date or mastered filter', async () => {
    const { service, prisma } = setup();
    await service.session('alice', { status: 'all' });
    expect(prisma.savedVocabularyWord.findMany.mock.calls[0][0].where).toEqual({
      userId: 'alice',
    });
  });
  it('combines due, source and search filters while restricting them to the owner', async () => {
    const { service, prisma } = setup();
    await service.session('alice', {
      status: 'due',
      source: 'lesson:lesson-01',
      search: 'đều',
    });
    expect(
      prisma.savedVocabularyWord.findMany.mock.calls[0][0].where,
    ).toMatchObject({
      userId: 'alice',
      nextReviewAt: { lte: expect.any(Date) },
      sources: { some: { sourceKey: { startsWith: 'lesson:lesson-01:' } } },
      OR: expect.any(Array),
    });
  });
  it('saving preserves progress and adds an immutable canonical source instead of AI examples', async () => {
    const { service, prisma } = setup();
    await service.save('alice', {
      word: 'consistent',
      requestedWord: 'consistent',
      meaning: 'đều đặn',
      source: { type: 'lesson', id: 'lesson-01', startTime: 2, endTime: 5 },
    });
    expect(prisma.savedVocabularyWord.upsert.mock.calls[0][0]).toMatchObject({
      where: {
        userId_wordKey_senseKey: {
          userId: 'alice',
          wordKey: 'consistent',
          senseKey: vocabularySenseKey('đều đặn'),
        },
      },
      update: {},
    });
    expect(
      prisma.savedVocabularyWord.upsert.mock.calls[0][0].create,
    ).not.toHaveProperty('correctCount');
    expect(prisma.savedVocabularySource.upsert.mock.calls[0][0]).toMatchObject({
      create: {
        title: 'Small habits',
        sentence: 'Small consistent actions matter.',
        startTime: 2,
        endTime: 5,
      },
      update: {},
    });
  });
  it('refuses words which were not selected from the original transcript', async () => {
    const { service, prisma } = setup();
    await expect(
      service.save('alice', {
        word: 'other',
        requestedWord: 'other',
        meaning: 'khác',
        source: { type: 'lesson', id: 'lesson-01', startTime: 2, endTime: 5 },
      }),
    ).rejects.toThrow('Chỉ lưu từ');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('cannot save a private video belonging to another account', async () => {
    const { service, prisma } = setup();
    await expect(
      service.resolveSource('alice', {
        type: 'video',
        id: 'private-job',
        startTime: 0,
        endTime: 2,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.videoTranslateJob.findFirst).toHaveBeenCalledWith({
      where: { id: 'private-job', userId: 'alice', status: 'READY' },
    });
  });

  it('saves a podcast word with the original transcript and the correct video title', async () => {
    const { service, prisma, featured } = setup();
    const video = PODCAST_CHANNELS[0].videos[0];
    featured.getTranscript.mockReturnValue({
      status: 'READY',
      segments: [
        { start: 0, end: 2, en: 'Hello, everyone.', vi: 'Xin chào mọi người.' },
      ],
    });
    await service.save('alice', {
      requestedWord: 'hello',
      word: 'hello',
      meaning: 'xin chào',
      source: {
        type: 'featured-video',
        id: video.id,
        startTime: 0,
        endTime: 2,
      },
    });
    expect(prisma.savedVocabularySource.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          sourceId: video.id,
          title: video.title,
          sentence: 'Hello, everyone.',
        }),
      }),
    );
  });

  it.each([
    [
      PODCAST_CHANNELS[0].videos[0].id,
      `/podcast?channel=bbc&v=${PODCAST_CHANNELS[0].videos[0].id}&t=0&end=2`,
    ],
    ['ErP_AKE3riY', '/kenh/volka-english/video/ErP_AKE3riY?t=0&end=2'],
  ])('replays public video %s in its own lesson screen', async (id, href) => {
    const { service, prisma, featured } = setup();
    featured.getTranscript.mockReturnValue({
      status: 'READY',
      segments: [{ start: 0, end: 2, en: 'Hello.', vi: 'Xin chào.' }],
    });
    prisma.savedVocabularySource.findFirst.mockResolvedValue({
      id: 'source',
      sourceType: 'featured-video',
      sourceId: id,
      startTime: 0,
      endTime: 2,
    });
    expect(await service.replay('alice', 'word', 'source')).toEqual({ href });
  });
  it('returns forgotten mastered words to learning with an early review', async () => {
    const { service, prisma } = setup();
    await service.review('alice', 'word', {
      correct: false,
      requestId: 'request',
      expectedReviewCount: 4,
    });
    expect(
      prisma.savedVocabularyWord.updateMany.mock.calls[0][0],
    ).toMatchObject({
      where: { id: 'word', userId: 'alice', reviewCount: 4 },
      data: {
        status: 'LEARNING',
        reviewCount: 5,
        streak: 0,
        lapses: 1,
        lastReviewRequestId: 'request',
      },
    });
  });
  it('does not record an answer twice when retrying the same request', async () => {
    const { service, prisma } = setup();
    prisma.savedVocabularyWord.findFirst.mockResolvedValue({
      ...fixture(),
      lastReviewRequestId: 'request',
    });
    await service.review('alice', 'word', {
      correct: true,
      requestId: 'request',
      expectedReviewCount: 3,
    });
    expect(prisma.savedVocabularyWord.updateMany).not.toHaveBeenCalled();
  });
  it('rejects stale review counts from another browser tab', async () => {
    const { service, prisma } = setup();
    await expect(
      service.review('alice', 'word', {
        correct: true,
        requestId: 'request',
        expectedReviewCount: 2,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.savedVocabularyWord.updateMany).not.toHaveBeenCalled();
  });
  it('cannot implicitly enroll missing words by submitting a review', async () => {
    const { service, prisma } = setup();
    prisma.savedVocabularyWord.findFirst.mockResolvedValue(null);
    await expect(
      service.review('alice', 'other-word', {
        correct: true,
        requestId: 'request',
        expectedReviewCount: 0,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('scopes removal to the owner', async () => {
    const { service, prisma } = setup();
    await service.remove('alice', 'word');
    expect(prisma.savedVocabularyWord.deleteMany).toHaveBeenCalledWith({
      where: { id: 'word', userId: 'alice' },
    });
  });
  it('does not reveal replay sources of another account', async () => {
    const { service, prisma } = setup();
    prisma.savedVocabularySource.findFirst.mockResolvedValue(null);
    await expect(
      service.replay('alice', 'other-word', 'source'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.savedVocabularySource.findFirst).toHaveBeenCalledWith({
      where: { id: 'source', wordId: 'other-word', word: { userId: 'alice' } },
    });
  });
});
