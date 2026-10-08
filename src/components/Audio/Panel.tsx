import { AUDIO_SOURCE_IDS, type AudioSourceId } from '@/lib/audio'
import SoundRow from '@/components/Audio/SoundRow'
import Slider from '@/components/ui/Slider'
import { useAudioMixer } from '@/hooks/useAudioMixer'
import { useAudioStore } from '@/store/useAudioStore'

const sourceNames: Record<AudioSourceId, string> = {
  rain: 'Rain',
  ocean: 'Ocean',
  cafe: 'Café',
  white: 'White noise',
  brown: 'Brown noise',
  delta: 'Delta',
  theta: 'Theta',
  wind: 'Wind',
}

export default function AudioPanel() {
  const masterVolume = useAudioStore((state) => state.masterVolume)
  const sources = useAudioStore((state) => state.sources)
  const playing = useAudioStore((state) => state.playing)
  const setMasterVolume = useAudioStore((state) => state.setMasterVolume)
  const setSourceVolume = useAudioStore((state) => state.setSourceVolume)
  const toggleSourceMuted = useAudioStore((state) => state.toggleSourceMuted)
  const { status, errorMessage, toggleSourcePlaying, startGentleSource } = useAudioMixer()
  const hasPlayingSource = AUDIO_SOURCE_IDS.some((id) => playing[id])

  return (
    <div className="space-y-5">
      <Slider
        label="Master volume"
        value={masterVolume}
        min={0}
        max={100}
        onChange={setMasterVolume}
      />

      {status === 'starting' ? (
        <p role="status" className="m-0 text-sm text-muted">Loading soundscape...</p>
      ) : null}
      {status === 'unavailable' || status === 'error' ? (
        <p role="alert" className="m-0 text-sm text-muted">{errorMessage}</p>
      ) : null}
      {!hasPlayingSource ? (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
          <p className="m-0 text-sm text-text">Your room is quiet.</p>
          <button
            type="button"
            aria-label="Start a gentle ocean soundscape"
            onClick={startGentleSource}
            className="mt-3 rounded-lg bg-accent/20 px-3 py-2 text-sm text-text hover:bg-accent/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            Start a gentle sound
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        {AUDIO_SOURCE_IDS.map((id) => (
          <SoundRow
            key={id}
            id={id}
            name={sourceNames[id]}
            volume={sources[id].volume}
            muted={sources[id].muted}
            playing={playing[id]}
            onVolumeChange={(volume) => setSourceVolume(id, volume)}
            onToggleMuted={() => toggleSourceMuted(id)}
            onTogglePlaying={() => toggleSourcePlaying(id)}
          />
        ))}
      </div>
    </div>
  )
}
