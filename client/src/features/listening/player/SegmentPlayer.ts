import type { Segment } from '../model/types';

export interface PlayerState {
  index: number;
  playing: boolean;
  time: number;
  rate: number;
  repeat: boolean;
  autoAdvance: boolean;
  error: string;
}
export type MediaPort = Pick<
  HTMLAudioElement,
  | 'currentTime'
  | 'playbackRate'
  | 'paused'
  | 'play'
  | 'pause'
  | 'addEventListener'
  | 'removeEventListener'
>;

/** Owns a single audio element. No global listeners, history writes, or shared player state. */
export class SegmentPlayer {
  state: PlayerState = {
    index: 0,
    playing: false,
    time: 0,
    rate: 1,
    repeat: false,
    autoAdvance: false,
    error: '',
  };
  private disposed = false;
  private operation = 0;
  private slow = false;
  private listeners: Array<[string, EventListener]> = [];
  private media: MediaPort;
  readonly segments: readonly Segment[];
  private changed: (state: PlayerState) => void;
  constructor(
    media: MediaPort,
    segments: readonly Segment[],
    changed: (state: PlayerState) => void,
  ) {
    this.media = media;
    this.segments = segments;
    this.changed = changed;
    const listen = (name: string, action: () => void) => {
      const listener: EventListener = () => action();
      media.addEventListener(name, listener);
      this.listeners.push([name, listener]);
    };
    listen('timeupdate', () => this.tick());
    listen('ended', () => this.finishSegment());
    listen('play', () => this.update({ playing: true, error: '' }));
    listen('pause', () => this.update({ playing: false }));
    listen('error', () =>
      this.update({
        playing: false,
        error: 'Không tải được audio. Hãy kiểm tra kết nối và thử phát lại.',
      }),
    );
  }
  private update(patch: Partial<PlayerState>) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    this.changed(this.state);
  }
  select(index: number) {
    if (!this.segments[index] || this.disposed) return;
    this.pause();
    this.media.currentTime = this.segments[index].time_start;
    this.update({ index, time: this.media.currentTime, error: '' });
  }
  async play(slow = false, replay = false) {
    const segment = this.segments[this.state.index];
    if (!segment || this.disposed) return;
    const operation = ++this.operation;
    this.slow = slow;
    this.media.playbackRate = slow ? 0.75 : this.state.rate;
    if (
      replay ||
      this.media.currentTime < segment.time_start ||
      this.media.currentTime >= segment.time_end - 0.02
    ) {
      this.media.currentTime = segment.time_start;
    }
    this.update({ error: '' });
    try {
      await this.media.play();
      if (this.disposed || operation !== this.operation) return;
      this.update({
        playing: !this.media.paused,
        time: this.media.currentTime,
      });
    } catch {
      if (operation === this.operation)
        this.update({
          playing: false,
          error: 'Chưa phát được audio. Bấm Phát để thử lại.',
        });
    }
  }
  pause() {
    ++this.operation;
    this.media.pause();
    this.slow = false;
    this.media.playbackRate = this.state.rate;
    this.update({ playing: false });
  }
  setRate(rate: number) {
    if (![0.5, 0.75, 0.8, 1, 1.2, 1.5].includes(rate)) return;
    this.update({ rate });
    if (!this.slow) this.media.playbackRate = rate;
  }
  configure(repeat: boolean, autoAdvance: boolean) {
    this.update({ repeat, autoAdvance });
  }
  tick() {
    if (this.disposed || this.media.paused) return;
    const segment = this.segments[this.state.index];
    if (segment && this.media.currentTime >= segment.time_end - 0.02)
      this.finishSegment();
    else this.update({ time: this.media.currentTime, playing: true });
  }
  private finishSegment() {
    if (this.disposed) return;
    const { index, repeat, autoAdvance } = this.state;
    this.pause();
    if (repeat) {
      this.select(index);
      void this.play();
    } else if (autoAdvance && index + 1 < this.segments.length) {
      this.select(index + 1);
      void this.play();
    } else this.update({ time: this.segments[index]?.time_end ?? 0 });
  }
  dispose() {
    this.pause();
    this.disposed = true;
    for (const [name, listener] of this.listeners)
      this.media.removeEventListener(name, listener);
    this.listeners = [];
  }
}
