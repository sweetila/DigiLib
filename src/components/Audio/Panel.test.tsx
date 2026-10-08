import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AudioPanel from './Panel'
import { useAudioStore } from '@/store/useAudioStore'

const engineMocks = vi.hoisted(() => ({
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
  setVolume: vi.fn(),
  setMaster: vi.fn(),
  dispose: vi.fn(),
}))

vi.mock('@/lib/audio/engine', () => ({
  AudioEngine: vi.fn(function MockAudioEngine() {
    return engineMocks
  }),
}))

describe('AudioPanel', () => {
  beforeEach(() => {
    localStorage.removeItem('digilib-audio')
    useAudioStore.getState().resetAudio()
    localStorage.removeItem('digilib-audio')
    vi.stubGlobal('AudioContext', class AudioContext {})
    vi.clearAllMocks()
  })

  it('renders controls, toggles a source, and updates its volume', async () => {
    render(<AudioPanel />)

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
})
