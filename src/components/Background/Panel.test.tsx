import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import BackgroundPanel from './Panel'
import { useBackgroundStore } from '@/store/useBackgroundStore'

describe('BackgroundPanel', () => {
  beforeEach(() => {
    useBackgroundStore.setState({
      type: 'none',
      youtube: null,
      currentVideoTitle: '',
      brightness: 100,
      blur: 0,
      overlay: 35,
      videoMuted: true,
      videoVolume: 0,
      videoPlaying: true,
    })
  })

  it('shows friendly validation for an invalid URL', () => {
    render(<BackgroundPanel />)
    fireEvent.change(screen.getByLabelText('YouTube video URL'), {
      target: { value: 'https://not-youtube.example/video' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Set YouTube background' }))
    expect(screen.getByRole('alert')).toHaveTextContent("That doesn't look like a valid YouTube URL.")
  })
})
