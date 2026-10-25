import { parseFeaturedCaptions } from './featured-video-captions';

describe('featured YouTube captions', () => {
  it('converts milliseconds while preserving timing throughout the video', () => {
    const result = parseFeaturedCaptions(
      {
        events: [
          { tStartMs: 33, dDurationMs: 2202, segs: [{ utf8: 'Hello.' }] },
          {
            tStartMs: 5038,
            dDurationMs: 1635,
            segs: [{ utf8: 'How are you?' }],
          },
          { tStartMs: 818984, dDurationMs: 3070, segs: [{ utf8: 'Goodbye.' }] },
        ],
      },
      822,
    );
    expect(result.map(({ start, end }) => ({ start, end }))).toEqual([
      { start: 0.033, end: 2.235 },
      { start: 5.038, end: 6.673 },
      { start: 818.984, end: 822 },
    ]);
  });

  it('rejects translation tracks with the entire script in the first cue', () => {
    expect(
      parseFeaturedCaptions(
        {
          events: [
            {
              tStartMs: 33,
              dDurationMs: 2202,
              segs: [
                { utf8: 'A full script incorrectly grouped at the beginning.' },
              ],
            },
            { tStartMs: 818984, dDurationMs: 3070, segs: [{ utf8: '' }] },
          ],
        },
        822,
      ),
    ).toEqual([]);
  });

  it('ignores malformed and empty cues', () => {
    expect(
      parseFeaturedCaptions(
        {
          events: [
            null,
            {},
            { tStartMs: -1, dDurationMs: 100, segs: [{ utf8: 'Invalid' }] },
          ],
        },
        10,
      ),
    ).toEqual([]);
  });
});
