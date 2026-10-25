import { scrollSentenceIntoView } from '../../client/src/lib/transcriptScroll';

describe('shared transcript scrolling', () => {
  let now: number;
  let nextFrame: number;
  let frames: Map<number, FrameRequestCallback>;
  let container: HTMLElement;

  beforeEach(() => {
    now = 0;
    nextFrame = 0;
    frames = new Map();
    jest.spyOn(performance, 'now').mockImplementation(() => now);
    jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frames.set(++nextFrame, callback);
        return nextFrame;
      });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      frames.delete(id);
    });
    container = document.createElement('div');
    Object.defineProperties(container, {
      scrollHeight: { value: 1200 },
      clientHeight: { value: 400 },
    });
    container.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    container.scrollTo = jest.fn((options: ScrollToOptions) => {
      container.scrollTop = options.top ?? 0;
    }) as typeof container.scrollTo;
  });

  afterEach(() => jest.restoreAllMocks());

  function row(top: number) {
    const element = document.createElement('article');
    element.getBoundingClientRect = () =>
      ({ top: 100 + top - container.scrollTop }) as DOMRect;
    return element;
  }

  function frame(time: number) {
    now = time;
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(time));
  }

  it('moves progressively and aligns the next sentence six pixels from the top', () => {
    scrollSentenceIntoView(container, row(300));
    expect(container.scrollTop).toBe(0);
    frame(90);
    const early = container.scrollTop;
    expect(early).toBeGreaterThan(0);
    frame(180);
    expect(container.scrollTop).toBeGreaterThan(early);
    expect(container.scrollTop).toBeLessThan(294);
    frame(360);
    expect(container.scrollTop).toBe(294);
    expect(frames.size).toBe(0);
  });

  it('cancels the previous motion when another sentence is selected', () => {
    const cancel = scrollSentenceIntoView(container, row(600));
    frame(180);
    cancel();
    expect(frames.size).toBe(0);
    scrollSentenceIntoView(container, row(100));
    frame(540);
    expect(container.scrollTop).toBe(94);
    frame(900);
    expect(container.scrollTop).toBe(94);
  });

  it('keeps the target within the scrollable area', () => {
    scrollSentenceIntoView(container, row(1500));
    frame(360);
    expect(container.scrollTop).toBe(800);
    scrollSentenceIntoView(container, row(0));
    frame(720);
    expect(container.scrollTop).toBe(0);
  });

  it('positions the initial sentence immediately without starting an animation', () => {
    scrollSentenceIntoView(container, row(100), 'auto');
    expect(container.scrollTop).toBe(94);
    expect(frames.size).toBe(0);
  });
});
