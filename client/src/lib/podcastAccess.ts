export interface PodcastPolicy {
  videoId: string;
  isPremium: boolean;
  previewSeconds: number;
}

export interface PodcastPlaybackAccess extends PodcastPolicy {
  canListenFull: boolean;
  previewLimitSeconds: number | null;
  premiumExpiresAt: string | null;
}

export const PODCAST_ACCESS_CHANGED = 'hihi:podcast-access-changed';
