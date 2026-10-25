export type YoutubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  unMute: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YoutubePlayer }) => void;
            onStateChange?: (event: {
              data: number;
              target: YoutubePlayer;
            }) => void;
            onError?: () => void;
          };
        },
      ) => YoutubePlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

export function loadYoutubeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise !== null) return youtubeApiPromise;

  youtubeApiPromise = new Promise<void>((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    let script = document.querySelector<HTMLScriptElement>(
      'script[data-youtube-iframe-api]',
    );
    const fail = () => {
      window.clearTimeout(timeout);
      script?.remove();
      window.onYouTubeIframeAPIReady = previousCallback;
      youtubeApiPromise = null;
      reject(new Error('Không tải được trình phát YouTube. Vui lòng thử lại.'));
    };
    const timeout = window.setTimeout(fail, 20_000);
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      previousCallback?.();
      resolve();
    };
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset.youtubeIframeApi = 'true';
      script.onerror = fail;
      document.body.appendChild(script);
    }
  });
  return youtubeApiPromise;
}
