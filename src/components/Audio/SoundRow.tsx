import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import type { AudioSourceId } from '@/lib/audio'
import Slider from '@/components/ui/Slider'

interface SoundRowProps {
  id: AudioSourceId
  name: string
  volume: number
  muted: boolean
  playing: boolean
  onVolumeChange: (volume: number) => void
  onToggleMuted: () => void
  onTogglePlaying: () => void
}

export default function SoundRow({
  id,
  name,
  volume,
  muted,
  playing,
  onVolumeChange,
  onToggleMuted,
  onTogglePlaying,
}: SoundRowProps) {
  return (
    <section
      aria-label={`${name} sound controls`}
      className={`rounded-xl border p-3 transition-colors ${
        playing
          ? 'border-accent/50 bg-accent/10'
          : 'border-white/[0.08] bg-white/[0.02]'
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="m-0 text-sm font-medium text-text">{name}</h2>
          {id === 'delta' || id === 'theta' ? (
            <p className="m-0 mt-1 text-xs text-muted">Best with headphones</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={playing ? `Pause ${name}` : `Play ${name}`}
            aria-pressed={playing}
            onClick={onTogglePlaying}
            className="grid size-10 place-items-center rounded-lg text-text hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            {playing
              ? <Pause aria-hidden="true" size={18} />
              : <Play aria-hidden="true" size={18} />}
          </button>
          <button
            type="button"
            aria-label={muted ? `Unmute ${name}` : `Mute ${name}`}
            aria-pressed={muted}
            onClick={onToggleMuted}
            className="grid size-10 place-items-center rounded-lg text-muted hover:bg-white/10 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            {muted
              ? <VolumeX aria-hidden="true" size={18} />
              : <Volume2 aria-hidden="true" size={18} />}
          </button>
        </div>
      </div>
      <Slider
        label={`${name} volume`}
        value={volume}
        min={0}
        max={100}
        onChange={onVolumeChange}
      />
    </section>
  )
}
