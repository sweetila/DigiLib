import { beforeEach, describe, expect, it } from 'vitest'
import { useBackgroundStore } from './useBackgroundStore'

const initialState = {
  type: 'none' as const,
  youtube: null,
  brightness: 100,
  blur: 0,
  overlay: 35,
  videoMuted: true,
  videoVolume: 0,
  videoPlaying: true,
}

describe('useBackgroundStore', () => {
  beforeEach(() => {
    localStorage.removeItem('digilib-background')
    useBackgroundStore.setState({ ...initialState, currentVideoTitle: '' })
  })

  it('accepts and stores a valid YouTube URL', () => {
    expect(useBackgroundStore.getState().setYouTube('https://youtu.be/Abc_def-123')).toEqual({ ok: true })
    expect(useBackgroundStore.getState()).toMatchObject({
      type: 'youtube',
      youtube: { videoId: 'Abc_def-123', url: 'https://youtu.be/Abc_def-123' },
    })
  })

  it('rejects an invalid URL without changing the current background', () => {
    const before = useBackgroundStore.getState()
    expect(useBackgroundStore.getState().setYouTube('https://evil.example/video')).toEqual({
      ok: false,
      message: "That doesn't look like a valid YouTube URL.",
    })
    expect(useBackgroundStore.getState().type).toBe(before.type)
  })

  it('falls back to defaults when persisted data is corrupted', async () => {
    localStorage.setItem('digilib-background', '{not valid json')
    await useBackgroundStore.persist.rehydrate()
    expect(useBackgroundStore.getState()).toMatchObject(initialState)
  })

  it('falls back to defaults when persisted fields fail validation', async () => {
    localStorage.setItem(
      'digilib-background',
      JSON.stringify({ state: { ...initialState, brightness: 999 }, version: 1 }),
    )
    await useBackgroundStore.persist.rehydrate()
    expect(useBackgroundStore.getState()).toMatchObject(initialState)
  })
})
