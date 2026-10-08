export {}

declare global {
  interface Window {
    YT?: YouTubeNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

export interface YouTubeNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string
      width?: string
      height?: string
      playerVars?: Record<string, string | number>
      events?: {
        onReady?: (event: YouTubePlayerEvent) => void
        onStateChange?: (event: YouTubePlayerStateEvent) => void
        onError?: (event: YouTubePlayerErrorEvent) => void
      }
    },
  ) => YouTubePlayer
  PlayerState: {
    UNSTARTED: number
    ENDED: number
    PLAYING: number
    PAUSED: number
    BUFFERING: number
    CUED: number
  }
}

interface YouTubePlayer {
  playVideo(): void
  pauseVideo(): void
  mute(): void
  unMute(): void
  isMuted(): boolean
  setVolume(volume: number): void
  loadVideoById(videoId: string, startSeconds?: number): void
  cueVideoById(videoId: string, startSeconds?: number): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getVideoData(): { title?: string }
  getPlayerState(): number
  destroy(): void
}

interface YouTubePlayerEvent {
  target: YouTubePlayer
}

interface YouTubePlayerStateEvent extends YouTubePlayerEvent {
  data: number
}

interface YouTubePlayerErrorEvent {
  data: number
}

export type { YouTubePlayer, YouTubePlayerEvent, YouTubePlayerStateEvent }
