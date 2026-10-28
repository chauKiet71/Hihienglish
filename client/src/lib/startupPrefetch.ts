/** Let the current route finish its reads before starting unrelated work. */
export function scheduleBackgroundPrefetch(
  critical: Promise<unknown>,
  run: () => void,
) {
  let cancelled = false;
  let queued = false;
  let idle: number | undefined;
  let fallback: ReturnType<typeof setTimeout> | undefined;
  const invoke = () => {
    if (!cancelled) run();
  };
  const queue = () => {
    if (queued || cancelled) return;
    queued = true;
    clearTimeout(deadline);
    if (typeof window.requestIdleCallback === 'function')
      idle = window.requestIdleCallback(invoke, { timeout: 1000 });
    else fallback = setTimeout(invoke, 0);
  };
  // A slow route must not postpone every other background read indefinitely.
  const deadline = setTimeout(queue, 750);
  void critical.then(queue, queue);
  return () => {
    cancelled = true;
    clearTimeout(deadline);
    clearTimeout(fallback);
    if (idle !== undefined) window.cancelIdleCallback(idle);
  };
}
