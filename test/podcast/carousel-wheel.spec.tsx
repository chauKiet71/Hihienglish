import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PodcastChannelRow from '../../client/src/features/podcast/PodcastChannelRow';
import { PODCAST_CHANNELS } from '../../client/src/features/podcast/catalog';

beforeEach(() => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});
afterEach(cleanup);

function openRows() {
  const view = render(
    <MemoryRouter>
      {PODCAST_CHANNELS.slice(0, 2).map((channel) => (
        <PodcastChannelRow key={channel.id} channel={channel} />
      ))}
    </MemoryRouter>,
  );
  const rows = screen.getAllByRole('region', { name: /^Video của / });
  for (const row of rows) {
    Object.defineProperties(row, {
      clientWidth: { value: 400 },
      scrollWidth: { value: 4000, configurable: true },
    });
    Object.defineProperty(
      row.querySelector('[data-carousel-item]'),
      'offsetWidth',
      { value: 180 },
    );
    row.scrollBy = jest.fn((options: ScrollToOptions) => {
      row.scrollLeft = Math.max(
        0,
        Math.min(
          row.scrollWidth - row.clientWidth,
          row.scrollLeft + (options.left ?? 0),
        ),
      );
    });
  }
  return { ...view, rows };
}

function wheel(target: Element, options: WheelEventInit) {
  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    ...options,
  });
  fireEvent(target, event);
  return event;
}

it('scrolls freely by the wheel distance in either direction within the hovered row', () => {
  const {
    rows: [row, otherRow],
  } = openRows();
  expect(wheel(row.firstElementChild!, { deltaY: 100 }).defaultPrevented).toBe(
    true,
  );
  expect(row.scrollLeft).toBe(100);
  expect(otherRow.scrollLeft).toBe(0);
  expect(wheel(row, { deltaY: -100 }).defaultPrevented).toBe(true);
  expect(row.scrollLeft).toBe(0);
});

it('allows normal page scrolling at either end and when there is no overflow', () => {
  const {
    rows: [row],
  } = openRows();
  expect(wheel(row, { deltaY: -100 }).defaultPrevented).toBe(false);
  row.scrollLeft = row.scrollWidth - row.clientWidth;
  expect(wheel(row, { deltaY: 100 }).defaultPrevented).toBe(false);
  Object.defineProperty(row, 'scrollWidth', { value: row.clientWidth });
  expect(wheel(row, { deltaY: -100 }).defaultPrevented).toBe(false);
  expect(row.scrollBy).not.toHaveBeenCalled();
});

it('preserves horizontal trackpad gestures and browser zoom', () => {
  const {
    rows: [row],
  } = openRows();
  expect(wheel(row, { deltaX: 100, deltaY: 5 }).defaultPrevented).toBe(false);
  expect(wheel(row, { deltaY: 100, ctrlKey: true }).defaultPrevented).toBe(
    false,
  );
  expect(wheel(row, { deltaY: 100, cancelable: false }).defaultPrevented).toBe(
    false,
  );
  expect(row.scrollBy).not.toHaveBeenCalled();
});

it('respects reduced motion and removes its wheel listener on unmount', () => {
  jest
    .mocked(window.matchMedia)
    .mockReturnValue({ matches: true } as MediaQueryList);
  const {
    rows: [row],
    unmount,
  } = openRows();
  wheel(row, { deltaY: 3, deltaMode: 1 });
  expect(row.scrollLeft).toBe(48);
  fireEvent.keyDown(row, { key: 'ArrowRight' });
  expect(row.scrollBy).toHaveBeenCalledWith({ left: 192, behavior: 'instant' });
  const position = row.scrollLeft;
  unmount();
  expect(wheel(row, { deltaY: 100 }).defaultPrevented).toBe(false);
  expect(row.scrollLeft).toBe(position);
  expect(row.scrollBy).toHaveBeenCalledTimes(1);
});
