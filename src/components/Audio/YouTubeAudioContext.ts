import { createContext, useContext } from 'react'
import type { YouTubePlayerStatus } from '@/hooks/useYouTubePlayer'

export interface YouTubeAudioControls {
  status: YouTubePlayerStatus
  videoTitle: string
  play: () => void
  pause: () => void
}

export const YouTubeAudioContext = createContext<YouTubeAudioControls | null>(null)

export function useYouTubeAudioControls(): YouTubeAudioControls {
  const controls = useContext(YouTubeAudioContext)
  if (!controls) throw new Error('YouTube audio controls must be used inside YouTubeAudioPlayer.')
  return controls
}
