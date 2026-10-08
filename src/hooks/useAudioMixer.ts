import { useCallback, useEffect, useRef, useState } from 'react'
import { AudioEngine, AUDIO_SOURCE_IDS, effectiveGain, type AudioSourceId } from '@/lib/audio'
import { useAudioStore } from '@/store/useAudioStore'

type MixerStatus = 'idle' | 'starting' | 'ready' | 'unavailable' | 'error'

let sharedEngine: AudioEngine | null = null

export function useAudioMixer() {
  const engineRef = useRef<AudioEngine | null>(sharedEngine)
  const pendingStarts = useRef(0)
  const [status, setStatus] = useState<MixerStatus>(
    sharedEngine ? 'ready' : 'idle',
  )
  const masterVolume = useAudioStore((state) => state.masterVolume)
  const sources = useAudioStore((state) => state.sources)
  const playing = useAudioStore((state) => state.playing)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    engine.setMaster(masterVolume / 100)
    for (const id of AUDIO_SOURCE_IDS) {
      const source = sources[id]
      engine.setVolume(id, effectiveGain(1, source.volume / 100, source.muted))
      if (!playing[id]) engine.stop(id)
    }
  }, [masterVolume, playing, sources])

  const toggleSourcePlaying = useCallback((id: AudioSourceId) => {
    const store = useAudioStore.getState()
    const engine = engineRef.current

    if (store.playing[id]) {
      engine?.stop(id)
      store.toggleSourcePlaying(id)
      return
    }
    if (typeof AudioContext === 'undefined') {
      setStatus('unavailable')
      setErrorMessage("Audio playback isn't available in this browser.")
      return
    }

    try {
      const activeEngine = engine ?? new AudioEngine()
      engineRef.current = activeEngine
      sharedEngine = activeEngine
      activeEngine.setMaster(store.masterVolume / 100)
      for (const sourceId of AUDIO_SOURCE_IDS) {
        const source = store.sources[sourceId]
        activeEngine.setVolume(
          sourceId,
          effectiveGain(1, source.volume / 100, source.muted),
        )
      }
      store.toggleSourcePlaying(id)
      pendingStarts.current += 1
      setStatus('starting')
      setErrorMessage('')

      void activeEngine.start(id).then(() => {
        if (!useAudioStore.getState().playing[id]) activeEngine.stop(id)
        pendingStarts.current -= 1
        setStatus(pendingStarts.current === 0 ? 'ready' : 'starting')
      }).catch((error: unknown) => {
        const latestState = useAudioStore.getState()
        if (latestState.playing[id]) latestState.toggleSourcePlaying(id)
        pendingStarts.current -= 1
        setStatus('error')
        setErrorMessage('Could not start this soundscape. Please try again.')
        console.error('Audio playback failed', error)
      })
    } catch (error) {
      setStatus('error')
      setErrorMessage('Could not start this soundscape. Please try again.')
      console.error('Audio playback failed', error)
    }
  }, [])

  const startGentleSource = useCallback(() => {
    const store = useAudioStore.getState()
    if (!store.playing.ocean) toggleSourcePlaying('ocean')
  }, [toggleSourcePlaying])

  return { status, errorMessage, toggleSourcePlaying, startGentleSource }
}
