import { SegmentPlayer } from '../../client/src/features/listening/player/SegmentPlayer';
import {
  buildSegments,
  formatSegmentTime,
} from '../../client/src/features/listening/model/segments';
import type { Segment } from '../../client/src/features/listening/model/types';

const segments: Segment[] = [
  {
    id: 'a',
    english: 'Hello,',
    vietnamese: 'Xin chào,',
    phonetic: '',
    time_start: 2,
    time_end: 5,
  },
  {
    id: 'b',
    english: 'how are you?',
    vietnamese: 'bạn thế nào?',
    phonetic: '',
    time_start: 5,
    time_end: 8,
  },
];
class FakeMedia extends EventTarget {
  currentTime = 0;
  playbackRate = 1;
  paused = true;
  play = jest.fn(async () => {
    this.paused = false;
    this.dispatchEvent(new Event('play'));
  });
  pause = jest.fn(() => {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  });
}
describe('segment player isolation and boundaries', () => {
  let media: FakeMedia;
  let player: SegmentPlayer;
  beforeEach(() => {
    media = new FakeMedia();
    player = new SegmentPlayer(media, segments, () => {});
  });
  afterEach(() => player.dispose());
  it('seeks precisely and stops at the sentence boundary', async () => {
    player.select(0);
    await player.play();
    expect(media.currentTime).toBe(2);
    media.currentTime = 5.1;
    player.tick();
    expect(media.paused).toBe(true);
    expect(player.state.index).toBe(0);
  });
  it('prioritizes sentence repeat over automatic next', async () => {
    player.configure(true, true);
    await player.play();
    media.currentTime = 5;
    player.tick();
    expect(player.state.index).toBe(0);
    expect(media.currentTime).toBe(2);
  });
  it('advances only when enabled and stops after the last sentence', async () => {
    player.configure(false, true);
    await player.play();
    media.currentTime = 5;
    player.tick();
    expect(player.state.index).toBe(1);
    expect(media.currentTime).toBe(5);
    media.currentTime = 8;
    player.tick();
    expect(media.paused).toBe(true);
    expect(player.state.index).toBe(1);
  });
  it('restores selected speed after slow replay', async () => {
    player.setRate(1.2);
    await player.play(true, true);
    expect(media.playbackRate).toBe(0.75);
    player.pause();
    expect(media.playbackRate).toBe(1.2);
  });
  it('ignores invalid indexes and speed values', () => {
    player.select(-1);
    player.select(99);
    player.setRate(100);
    expect(player.state.index).toBe(0);
    expect(player.state.rate).toBe(1);
  });
  it('surfaces playback rejection without reporting playing', async () => {
    media.play.mockRejectedValueOnce(new Error('blocked'));
    await player.play();
    expect(player.state.playing).toBe(false);
    expect(player.state.error).not.toBe('');
  });
  it('removes event handlers and pauses on disposal', async () => {
    const changed = jest.fn();
    const isolated = new SegmentPlayer(media, segments, changed);
    await isolated.play();
    isolated.dispose();
    changed.mockClear();
    media.dispatchEvent(new Event('error'));
    expect(changed).not.toHaveBeenCalled();
    expect(media.paused).toBe(true);
  });
});
describe('segment grouping', () => {
  it('rounds fractional timestamps across a minute correctly', () => {
    expect(formatSegmentTime(59.99)).toBe('01:00.0');
    expect(formatSegmentTime(1.24)).toBe('00:01.2');
  });
  it('merges unfinished clauses and preserves timestamps and originals', () => {
    const result = buildSegments(segments, 'long');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'a+b',
      time_start: 2,
      time_end: 8,
      english: 'Hello, how are you?',
    });
    expect(segments[0].english).toBe('Hello,');
  });
  it('keeps short sentences separate', () =>
    expect(buildSegments(segments, 'short')).toHaveLength(2));
  it('does not merge across long silences', () =>
    expect(
      buildSegments(
        [segments[0], { ...segments[1], time_start: 20, time_end: 22 }],
        'long',
      ),
    ).toHaveLength(2));
  it('discards invalid and empty segments', () =>
    expect(
      buildSegments(
        [
          { ...segments[0], time_end: NaN },
          { ...segments[1], english: '' },
        ],
        'short',
      ),
    ).toEqual([]));
});
