import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  channelFilter,
  youtubeDuration,
  YoutubeCatalogService,
} from './youtube-catalog.service';

describe('YouTube catalog metadata', () => {
  const service = new YoutubeCatalogService({ get: () => 'test-key' } as never);
  const original = global.fetch;
  afterEach(() => {
    global.fetch = original;
  });
  it.each([
    ['https://www.youtube.com/@VolkaEnglish', { forHandle: '@VolkaEnglish' }],
    ['@VolkaEnglish', { forHandle: '@VolkaEnglish' }],
    [
      'https://youtube.com/channel/UCcvjK35lDPZTlkIrrwxpepg',
      { id: 'UCcvjK35lDPZTlkIrrwxpepg' },
    ],
  ])('resolves supported channel identifiers %s', (url, expected) =>
    expect(channelFilter(url)).toEqual(expected),
  );
  it.each([
    'https://youtube.com.evil.test/@abc',
    'https://localhost/@abc',
    'file:///tmp/test',
    'https://user:secret@youtube.com/@abc',
    'https://youtube.com/%broken',
    'https://youtube.com/watch?v=abc',
  ])('rejects unsupported URLs before network access %s', (url) =>
    expect(() => channelFilter(url)).toThrow(BadRequestException),
  );
  it.each([
    ['PT23M46S', 1426],
    ['PT1H2M3S', 3723],
    ['P1DT1S', 86401],
    ['live', 0],
  ])('parses durations %s', (value, duration) =>
    expect(youtubeDuration(value as string)).toBe(duration),
  );
  it('uses only the fixed Google API origin and follows page tokens', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [{ contentDetails: { videoId: 'video000001' } }],
          nextPageToken: 'next',
        }),
      });
    expect(await service.page('uploads', 'page2')).toEqual({
      ids: ['video000001'],
      nextPageToken: 'next',
    });
    const url = new URL(String((global.fetch as jest.Mock).mock.calls[0][0]));
    expect(url.origin).toBe('https://www.googleapis.com');
    expect(url.searchParams.get('pageToken')).toBe('page2');
    expect(url.searchParams.get('maxResults')).toBe('50');
  });
  it('filters unavailable, private, non-embeddable and live videos while keeping playlist order', async () => {
    const item = (id: string, extra = {}) => ({
      id,
      snippet: {
        title: id,
        channelId: 'channel',
        publishedAt: '2026-01-01',
        liveBroadcastContent: 'none',
      },
      contentDetails: { duration: 'PT2M' },
      status: { privacyStatus: 'public', embeddable: true },
      ...extra,
    });
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            item('b'),
            item('private', {
              status: { privacyStatus: 'private', embeddable: true },
            }),
            item('a'),
            item('blocked', {
              status: { privacyStatus: 'public', embeddable: false },
            }),
            item('live', { snippet: { liveBroadcastContent: 'live' } }),
          ],
        }),
      });
    expect(
      (
        await service.videos([
          'a',
          'private',
          'missing',
          'b',
          'blocked',
          'live',
        ])
      ).map((video) => video.id),
    ).toEqual(['a', 'b']);
  });
  it('fails clearly when the server key is missing', async () => {
    await expect(
      new YoutubeCatalogService({ get: () => undefined } as never).channel(
        '@abc',
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
  it('reports quota/configuration errors without exposing the credential', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });
    await expect(service.page('uploads')).rejects.toThrow('hạn mức');
    await expect(service.page('uploads')).rejects.not.toThrow('test-key');
  });
});
