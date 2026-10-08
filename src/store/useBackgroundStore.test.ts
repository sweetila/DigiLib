import { beforeEach, describe, expect, it } from 'vitest'
import { migrate, useBackgroundStore } from './useBackgroundStore'

const initialState = {
  schemaVersion: 2 as const,
  type: 'none' as const,
  youtube: null,
  recentYouTube: [],
  brightness: 100,
  blur: 0,
  overlay: 35,
  videoMuted: true,
  videoVolume: 0,
  videoPlaying: true,
  freezeToStill: false,
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
      youtube: { videoId: 'Abc_def-123', url: 'https://youtu.be/Abc_def-123', startSeconds: 0 },
      recentYouTube: [{ videoId: 'Abc_def-123', url: 'https://youtu.be/Abc_def-123' }],
    })
  })

  it('migrates version 1 settings and defaults freeze mode to false', () => {
    const migrated = migrate(
      {
        schemaVersion: 1,
        type: 'youtube',
        youtube: { videoId: 'Abc_def-123', url: 'https://youtu.be/Abc_def-123?t=90' },
        brightness: 100,
        blur: 0,
        overlay: 35,
        videoMuted: true,
        videoVolume: 0,
        videoPlaying: true,
      },
      1,
    )
    expect(migrated).toMatchObject({
      schemaVersion: 2,
      youtube: { videoId: 'Abc_def-123', startSeconds: 90 },
      freezeToStill: false,
      recentYouTube: [{ videoId: 'Abc_def-123' }],
    })
  })

  it('persists freeze-to-still mode', () => {
    useBackgroundStore.getState().setFreezeToStill(true)
    const stored = JSON.parse(localStorage.getItem('digilib-background') ?? '{}')
    expect(stored.state.freezeToStill).toBe(true)
  })

  it('deduplicates recent videos, keeps the newest first, and caps the list at eight', () => {
    const ids = [
      'Abc_def-123',
      'Bbc_def-123',
      'Cbc_def-123',
      'Dbc_def-123',
      'Ebc_def-123',
      'Fbc_def-123',
      'Gbc_def-123',
      'Hbc_def-123',
      'Ibc_def-123',
    ]
    for (const videoId of ids) {
      useBackgroundStore.getState().setYouTube(`https://youtu.be/${videoId}`)
    }
    useBackgroundStore.getState().setCurrentVideoTitle('Newest title')
    useBackgroundStore.getState().setYouTube(`https://www.youtube.com/watch?v=${ids[8]}&t=20`)
    const recents = useBackgroundStore.getState().recentYouTube
    expect(recents).toHaveLength(8)
    expect(recents[0]).toMatchObject({ videoId: ids[8], title: 'Newest title' })
    expect(recents.map((item) => item.videoId)).toEqual(ids.slice(1).reverse())
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
