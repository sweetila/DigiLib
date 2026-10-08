import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AudioPanel from './Panel'
import YouTubeAudioPlayer from './YouTubeAudioPlayer'
import { useAudioStore } from '@/store/useAudioStore'

const engineMocks = vi.hoisted(() => ({
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
  setVolume: vi.fn(),
  setMaster: vi.fn(),
  dispose: vi.fn(),
}))

const youtubePlayerMocks = vi.hoisted(() => ({
  play: vi.fn(),
  pause: vi.fn(),
}))

vi.mock('@/lib/audio/engine', () => ({
  AudioEngine: vi.fn(function MockAudioEngine() {
    return engineMocks
  }),
}))

vi.mock('@/hooks/useYouTubePlayer', () => ({
  useYouTubePlayer: vi.fn(() => ({
    status: 'ready',
    errorMessage: '',
    videoTitle: 'Study playlist',
    play: youtubePlayerMocks.play,
    pause: youtubePlayerMocks.pause,
    togglePlay: vi.fn(),
    replay: vi.fn(),
    mute: vi.fn(),
    unmute: vi.fn(),
    setVolume: vi.fn(),
    loadVideo: vi.fn(),
  })),
}))

describe('AudioPanel', () => {
  afterEach(cleanup)

  beforeEach(() => {
    localStorage.removeItem('digilib-audio')
    useAudioStore.getState().resetAudio()
    localStorage.removeItem('digilib-audio')
    vi.stubGlobal('AudioContext', class AudioContext {})
    vi.clearAllMocks()
  })

  it('renders controls, toggles a source, and updates its volume', async () => {
    render(
      <YouTubeAudioPlayer>
        <AudioPanel />
      </YouTubeAudioPlayer>,
    )

    expect(screen.getByText('Your room is quiet.')).toBeInTheDocument()
    expect(screen.getByLabelText('Master volume')).toBeInTheDocument()
    expect(screen.getAllByText('Best with headphones')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Play Rain' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pause Rain' })).toBeInTheDocument()
    })
    expect(engineMocks.start).toHaveBeenCalledWith('rain')

    fireEvent.change(screen.getByLabelText('Rain volume'), {
      target: { value: '42' },
    })
    expect(useAudioStore.getState().sources.rain.volume).toBe(42)
  })

  it('validates, adds, and removes a YouTube music video', () => {
    render(
      <YouTubeAudioPlayer>
        <AudioPanel />
      </YouTubeAudioPlayer>,
    )

    fireEvent.change(screen.getByLabelText('YouTube Music URL'), {
      target: { value: 'https://evil.example/video' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      "That doesn't look like a valid YouTube URL.",
    )
    expect(useAudioStore.getState().youtubeAudio).toBeNull()

    fireEvent.change(screen.getByLabelText('YouTube Music URL'), {
      target: { value: 'https://youtu.be/Abc_def-123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('Study playlist')).toBeInTheDocument()
    expect(useAudioStore.getState().youtubeAudio?.videoId).toBe('Abc_def-123')

    fireEvent.click(screen.getByRole('button', { name: 'Remove YouTube Music' }))
    expect(useAudioStore.getState().youtubeAudio).toBeNull()
    expect(screen.queryByText('Study playlist')).not.toBeInTheDocument()
  })
})
