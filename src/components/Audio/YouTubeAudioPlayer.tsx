import { useRef, type ReactNode } from 'react'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { useAudioStore } from '@/store/useAudioStore'
import { YouTubeAudioContext, type YouTubeAudioControls } from './YouTubeAudioContext'

interface YouTubeAudioPlayerProps {
  children: ReactNode
}

export default function YouTubeAudioPlayer({ children }: YouTubeAudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const audio = useAudioStore((state) => state.youtubeAudio)
  const youtubeVolume = useAudioStore((state) => state.youtubeVolume)
  const masterVolume = useAudioStore((state) => state.masterVolume)
  const muted = useAudioStore((state) => state.youtubeMuted)
  const autoplay = useAudioStore((state) => state.youtubePlaying)
  const setPlaying = useAudioStore((state) => state.setYouTubePlaying)
  const player = useYouTubePlayer({
    containerRef,
    videoId: audio?.videoId ?? '',
    startSeconds: 0,
    muted,
    volume: Math.round((youtubeVolume * masterVolume) / 100),
    loop: true,
    autoplay: Boolean(audio && autoplay),
  })
  const controls: YouTubeAudioControls = {
    status: player.status,
    videoTitle: player.videoTitle,
    play: () => {
      player.play()
      setPlaying(true)
    },
    pause: () => {
      player.pause()
      setPlaying(false)
    },
  }

  return (
    <YouTubeAudioContext.Provider value={controls}>
      <div
        ref={containerRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      />
      {children}
    </YouTubeAudioContext.Provider>
  )
}
