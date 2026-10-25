import { useCallback, useEffect, useRef, useState } from 'react';
import { SegmentPlayer, type PlayerState } from './SegmentPlayer';
import type { Segment } from '../model/types';

export function useSegmentPlayer(
  segments: readonly Segment[],
  initialIndex: number,
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const controller = useRef<SegmentPlayer | null>(null);
  const initial = useRef(initialIndex);
  const [state, setState] = useState<PlayerState>({
    index: initialIndex,
    playing: false,
    time: segments[initialIndex]?.time_start ?? 0,
    rate: 1,
    repeat: false,
    autoAdvance: false,
    error: '',
  });
  useEffect(() => {
    if (!audioRef.current) return;
    const player = new SegmentPlayer(audioRef.current, segments, setState);
    controller.current = player;
    player.select(Math.min(initial.current, Math.max(0, segments.length - 1)));
    const timer = window.setInterval(() => player.tick(), 40);
    return () => {
      window.clearInterval(timer);
      player.dispose();
      controller.current = null;
    };
  }, [segments]);
  const select = useCallback(
    (index: number) => controller.current?.select(index),
    [],
  );
  const pause = useCallback(() => controller.current?.pause(), []);
  const play = useCallback((slow = false, replay = false) => {
    void controller.current?.play(slow, replay);
  }, []);
  const setRate = useCallback(
    (rate: number) => controller.current?.setRate(rate),
    [],
  );
  const configure = useCallback(
    (repeat: boolean, autoAdvance: boolean) =>
      controller.current?.configure(repeat, autoAdvance),
    [],
  );
  return { audioRef, state, select, pause, play, setRate, configure };
}
