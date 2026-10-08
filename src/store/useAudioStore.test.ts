import { beforeEach, describe, expect, it } from 'vitest'
import { AUDIO_SOURCE_IDS } from '@/lib/audio'
import { migrate, useAudioStore } from './useAudioStore'

describe('useAudioStore', () => {
  beforeEach(() => {
    useAudioStore.getState().resetAudio()
    localStorage.removeItem('digilib-audio')
  })

  it('clamps master and source volumes to 0..100', () => {
    const store = useAudioStore.getState()
    store.setMasterVolume(130)
    store.setSourceVolume('rain', -5)
    expect(useAudioStore.getState().masterVolume).toBe(100)
    expect(useAudioStore.getState().sources.rain.volume).toBe(0)

    useAudioStore.getState().setMasterVolume(Number.NaN)
    useAudioStore.getState().setSourceVolume('rain', 40)
    expect(useAudioStore.getState().masterVolume).toBe(0)
    expect(useAudioStore.getState().sources.rain.volume).toBe(40)
  })

  it('keeps playback state out of persistence', () => {
    useAudioStore.getState().toggleSourcePlaying('rain')
    useAudioStore.getState().setAutoStart(true)

    const saved = JSON.parse(localStorage.getItem('digilib-audio') ?? '{}')
    expect(saved.state).toMatchObject({ autoStart: true })
    expect(saved.state.playing).toBeUndefined()
    expect(useAudioStore.getState().playing.rain).toBe(true)
  })

  it('toggles mute and playback and stops every source', () => {
    const store = useAudioStore.getState()
    store.toggleSourceMuted('theta')
    store.toggleSourcePlaying('rain')
    store.toggleSourcePlaying('theta')
    useAudioStore.getState().stopAll()

    expect(useAudioStore.getState().sources.theta.muted).toBe(true)
    expect(AUDIO_SOURCE_IDS.every((id) => !useAudioStore.getState().playing[id])).toBe(true)
  })

  it('resets saved settings and playback state', () => {
    useAudioStore.getState().setMasterVolume(10)
    useAudioStore.getState().setSourceVolume('rain', 5)
    useAudioStore.getState().toggleSourcePlaying('rain')
    useAudioStore.getState().resetAudio()

    expect(useAudioStore.getState()).toMatchObject({
      masterVolume: 70,
      autoStart: false,
      sources: { rain: { volume: 70, muted: false } },
      playing: { rain: false },
    })
  })

  it('defaults safely when stored JSON is corrupted', async () => {
    localStorage.setItem('digilib-audio', '{invalid json')
    await useAudioStore.persist.rehydrate()

    expect(useAudioStore.getState()).toMatchObject({
      masterVolume: 70,
      autoStart: false,
      sources: { ocean: { volume: 30, muted: false } },
      playing: { rain: false },
    })
  })

  it('defaults safely when persisted fields are invalid', async () => {
    localStorage.setItem(
      'digilib-audio',
      JSON.stringify({
        state: {
          schemaVersion: 1,
          masterVolume: 101,
          autoStart: true,
          sources: useAudioStore.getState().sources,
        },
        version: 1,
      }),
    )
    await useAudioStore.persist.rehydrate()

    expect(useAudioStore.getState()).toMatchObject({
      masterVolume: 70,
      autoStart: false,
      playing: { rain: false },
    })
  })

  it('migrates invalid or unsupported versions to defaults', () => {
    expect(migrate({ masterVolume: -1 }, 1).masterVolume).toBe(70)
    expect(migrate({}, 99).autoStart).toBe(false)
  })
})
