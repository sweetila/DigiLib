import { describe, expect, it } from 'vitest'
import { AUDIO_SOURCE_IDS, type AudioSourceId } from './sources'
import { describeSoundscape } from './describeSoundscape'

function stoppedSources(): Record<AudioSourceId, boolean> {
  return Object.fromEntries(AUDIO_SOURCE_IDS.map((id) => [id, false])) as Record<
    AudioSourceId,
    boolean
  >
}

describe('describeSoundscape', () => {
  it('describes playing sources in stable source order', () => {
    const playing = stoppedSources()
    playing.ocean = true
    playing.rain = true
    expect(describeSoundscape(playing, null)).toBe('Rain + Ocean')
  })

  it('includes YouTube Music or returns null when nothing plays', () => {
    const playing = stoppedSources()
    const youtube = { url: 'https://youtu.be/Abc_def-123', videoId: 'Abc_def-123' }
    expect(describeSoundscape(playing, youtube)).toBe('YouTube Music')
    expect(describeSoundscape(playing, null)).toBeNull()
  })
})
