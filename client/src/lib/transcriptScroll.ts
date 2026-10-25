const ACTIVE_SENTENCE_SLOT_TOP = 6;
const TRANSCRIPT_SCROLL_DURATION_MS = 360;

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

/** Keep the active sentence near the top, using the same motion in every lesson. */
export function scrollSentenceIntoView(
  container: HTMLElement,
  element: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
): () => void {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const offsetTop = elementRect.top - containerRect.top + container.scrollTop;
  const targetTop = offsetTop - ACTIVE_SENTENCE_SLOT_TOP;
  const maxScroll = Math.max(
    0,
    container.scrollHeight - container.clientHeight,
  );
  const clampedTargetTop = Math.min(maxScroll, Math.max(0, targetTop));

  if (behavior !== 'smooth') {
    container.scrollTo({ top: clampedTargetTop, behavior: 'auto' });
    return () => undefined;
  }

  const startTop = container.scrollTop;
  const distance = clampedTargetTop - startTop;
  if (Math.abs(distance) < 1) return () => undefined;

  const startedAt = performance.now();
  let animationFrame = 0;
  const animate = (now: number) => {
    const progress = Math.min(
      (now - startedAt) / TRANSCRIPT_SCROLL_DURATION_MS,
      1,
    );
    container.scrollTop = startTop + distance * easeInOutCubic(progress);
    if (progress < 1) animationFrame = requestAnimationFrame(animate);
  };

  animationFrame = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationFrame);
}
