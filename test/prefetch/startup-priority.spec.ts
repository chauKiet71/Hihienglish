import { scheduleBackgroundPrefetch } from '../../client/src/lib/startupPrefetch';
import { prefetchAppFeatures } from '../../client/src/lib/prefetchFeatures';
import { api } from '../../client/src/lib/api';

describe('First-route prefetch priority', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  it('finishes critical route reads before unrelated background requests', async () => {
    jest.useFakeTimers();
    let finish!: () => void;
    const run = jest.fn();
    const cancel = scheduleBackgroundPrefetch(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
      run,
    );
    await jest.advanceTimersByTimeAsync(100);
    expect(run).not.toHaveBeenCalled();
    finish();
    await jest.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(1);
    cancel();
  });
  it('bounds the wait and cancels deferred reads when navigation or account changes', async () => {
    jest.useFakeTimers();
    const run = jest.fn();
    const cancel = scheduleBackgroundPrefetch(new Promise(() => {}), run);
    await jest.advanceTimersByTimeAsync(749);
    expect(run).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(2);
    expect(run).toHaveBeenCalledTimes(1);
    cancel();
    const cancelled = jest.fn();
    const stop = scheduleBackgroundPrefetch(Promise.resolve(), cancelled);
    stop();
    await jest.advanceTimersByTimeAsync(2000);
    expect(cancelled).not.toHaveBeenCalled();
  });
  it('does not start account or package requests in the podcast critical phase', async () => {
    jest.spyOn(api, 'getPodcastCatalog').mockResolvedValue([]);
    jest.spyOn(api, 'getPodcastAccessMap').mockResolvedValue({});
    const saved = jest.spyOn(api, 'getSavedVocabulary');
    const jobs = jest.spyOn(api, 'listVideoTranslateJobs');
    const packages = jest.spyOn(api, 'getPackages');
    await prefetchAppFeatures(true, true, {
      pathname: '/podcast',
      critical: true,
    });
    expect(api.getPodcastCatalog).toHaveBeenCalledTimes(1);
    expect(api.getPodcastAccessMap).toHaveBeenCalledTimes(1);
    expect(saved).not.toHaveBeenCalled();
    expect(jobs).not.toHaveBeenCalled();
    expect(packages).not.toHaveBeenCalled();
  });
});
