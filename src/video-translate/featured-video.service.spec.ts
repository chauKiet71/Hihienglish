import { NotFoundException } from '@nestjs/common';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { FeaturedVideoService } from './featured-video.service';
import { PODCAST_CHANNELS } from '../catalog/podcast';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('FeaturedVideoService', () => {
  const segments = [{ start: 0, end: 2, en: 'Hello.', vi: 'Xin chào.' }];
  let prepare: jest.Mock;
  let service: FeaturedVideoService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(existsSync).mockReturnValue(false);
    prepare = jest.fn().mockResolvedValue(segments);
    service = new FeaturedVideoService({
      prepareFeaturedTranscript: prepare,
    } as never);
  });

  it('rejects IDs outside the public catalog before processing or reading storage', () => {
    expect(() => service.prepareTranscript('../private')).toThrow(
      NotFoundException,
    );
    expect(prepare).not.toHaveBeenCalled();
    expect(existsSync).not.toHaveBeenCalled();
  });

  it('does not start paid processing from a GET request', () => {
    expect(service.getTranscript('ErP_AKE3riY').status).toBe('PENDING');
    expect(prepare).not.toHaveBeenCalled();
  });

  it('allows the bundled podcast videos without processing them from GET requests', () => {
    for (const channel of PODCAST_CHANNELS) {
      for (const video of channel.videos) {
        expect(service.getTranscript(video.id).status).toBe('PENDING');
      }
    }
    expect(prepare).not.toHaveBeenCalled();
  });

  it('prepares and caches a podcast transcript using its actual duration', async () => {
    const video = PODCAST_CHANNELS[0].videos[0];
    expect(service.prepareTranscript(video.id).status).toBe('PROCESSING');
    expect(prepare).toHaveBeenCalledWith(
      video.id,
      video.duration,
      expect.stringContaining(video.id),
    );
    await Promise.resolve();
    expect(service.getTranscript(video.id)).toEqual({
      status: 'READY',
      segments,
      errorMessage: null,
    });
    service.prepareTranscript(video.id);
    expect(prepare).toHaveBeenCalledTimes(1);
  });

  it('shares concurrent requests and persists the completed transcript', async () => {
    let complete!: (value: typeof segments) => void;
    prepare.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const first = service.prepareTranscript('ErP_AKE3riY');
    expect(service.prepareTranscript('ErP_AKE3riY')).toBe(first);
    expect(prepare).toHaveBeenCalledTimes(1);
    complete(segments);
    await Promise.resolve();
    expect(service.getTranscript('ErP_AKE3riY')).toEqual({
      status: 'READY',
      segments,
      errorMessage: null,
    });
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('transcript-v2.json'),
      JSON.stringify(segments),
      'utf8',
    );
    service.prepareTranscript('ErP_AKE3riY');
    expect(prepare).toHaveBeenCalledTimes(1);
  });

  it('reuses the disk cache after a server restart', () => {
    jest.mocked(existsSync).mockReturnValue(true);
    jest.mocked(readFileSync).mockReturnValue(JSON.stringify(segments));
    expect(service.prepareTranscript('ErP_AKE3riY').status).toBe('READY');
    expect(prepare).not.toHaveBeenCalled();
  });

  it('exposes failure and starts a new attempt only on an explicit retry', async () => {
    prepare.mockRejectedValueOnce(new Error('Provider unavailable'));
    service.prepareTranscript('ErP_AKE3riY');
    await Promise.resolve();
    expect(service.getTranscript('ErP_AKE3riY').status).toBe('FAILED');
    expect(prepare).toHaveBeenCalledTimes(1);
    service.prepareTranscript('ErP_AKE3riY');
    await Promise.resolve();
    expect(service.getTranscript('ErP_AKE3riY').status).toBe('READY');
    expect(prepare).toHaveBeenCalledTimes(2);
  });

  it('regenerates an invalid cache instead of returning malformed timing', async () => {
    jest.mocked(existsSync).mockReturnValue(true);
    jest
      .mocked(readFileSync)
      .mockReturnValue(JSON.stringify([{ ...segments[0], end: -1 }]));
    expect(service.prepareTranscript('ErP_AKE3riY').status).toBe('PROCESSING');
    await Promise.resolve();
    expect(service.getTranscript('ErP_AKE3riY').segments).toEqual(segments);
  });
});
