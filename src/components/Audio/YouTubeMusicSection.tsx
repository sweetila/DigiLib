import { useRef, useState, type FormEvent } from 'react'
import { Pause, Play, Trash2, Volume2, VolumeX } from 'lucide-react'
import Slider from '@/components/ui/Slider'
import { useYouTubeAudioControls } from '@/components/Audio/YouTubeAudioContext'
import { useAudioStore } from '@/store/useAudioStore'

const invalidUrlMessage = "That doesn't look like a valid YouTube URL."

export default function YouTubeMusicSection() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState('')
  const [validationMessage, setValidationMessage] = useState('')
  const audio = useAudioStore((state) => state.youtubeAudio)
  const volume = useAudioStore((state) => state.youtubeVolume)
  const muted = useAudioStore((state) => state.youtubeMuted)
  const playing = useAudioStore((state) => state.youtubePlaying)
  const setYouTubeAudio = useAudioStore((state) => state.setYouTubeAudio)
  const clearYouTubeAudio = useAudioStore((state) => state.clearYouTubeAudio)
  const setVolume = useAudioStore((state) => state.setYouTubeVolume)
  const setMuted = useAudioStore((state) => state.setYouTubeMuted)
  const player = useYouTubeAudioControls()

  const addVideo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = setYouTubeAudio(url)
    if (!result.ok) {
      setValidationMessage(invalidUrlMessage)
      return
    }
    setValidationMessage('')
    setUrl('')
  }

  const chooseAnother = () => {
    clearYouTubeAudio()
    setValidationMessage('')
    inputRef.current?.focus()
  }

  return (
    <section aria-label="YouTube Music" className="space-y-3">
      <h2 className="m-0 text-sm font-semibold text-text">YouTube Music</h2>
      <form className="flex gap-2" onSubmit={addVideo}>
        <input
          ref={inputRef}
          aria-label="YouTube Music URL"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-text placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          onChange={(event) => {
            setUrl(event.currentTarget.value)
            setValidationMessage('')
          }}
          placeholder="Paste a YouTube URL"
          type="text"
          value={url}
        />
        <button
          className="rounded-lg bg-accent/20 px-3 py-2 text-sm text-text hover:bg-accent/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          type="submit"
        >
          Add
        </button>
      </form>
      {validationMessage ? (
        <p className="m-0 text-sm text-muted" role="alert">{validationMessage}</p>
      ) : null}

      {audio ? (
        <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
          <div className="flex items-center gap-3">
            <img
              alt=""
              className="size-14 shrink-0 rounded-lg object-cover"
              src={`https://i.ytimg.com/vi/${audio.videoId}/hqdefault.jpg`}
            />
            <p className="m-0 min-w-0 text-sm font-medium text-text">
              {player.videoTitle || 'YouTube Music'}
            </p>
          </div>

          {player.status === 'loading' || player.status === 'buffering' ? (
            <p className="m-0 text-sm text-muted" role="status">Loading soundscape...</p>
          ) : null}
          {player.status === 'blocked' ? (
            <div className="space-y-2">
              <p className="m-0 text-sm text-muted">Your browser blocked autoplay.</p>
              <button
                aria-label="Start music"
                className="rounded-lg bg-accent/20 px-3 py-2 text-sm text-text hover:bg-accent/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                onClick={player.play}
                type="button"
              >
                Start music
              </button>
            </div>
          ) : null}
          {player.status === 'error' ? (
            <div className="space-y-2">
              <p className="m-0 text-sm text-muted">
                This video couldn&apos;t be played. Choose another video.
              </p>
              <button
                className="rounded-lg bg-accent/20 px-3 py-2 text-sm text-text hover:bg-accent/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                onClick={chooseAnother}
                type="button"
              >
                Choose another video
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-1">
            <button
              aria-label={playing ? 'Pause YouTube Music' : 'Play YouTube Music'}
              aria-pressed={playing}
              className="grid size-10 place-items-center rounded-lg text-text hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              onClick={() => {
                if (playing) player.pause()
                else player.play()
              }}
              type="button"
            >
              {playing ? <Pause aria-hidden="true" size={18} /> : <Play aria-hidden="true" size={18} />}
            </button>
            <button
              aria-label={muted ? 'Unmute YouTube Music' : 'Mute YouTube Music'}
              aria-pressed={muted}
              className="grid size-10 place-items-center rounded-lg text-muted hover:bg-white/10 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              onClick={() => setMuted(!muted)}
              type="button"
            >
              {muted ? <VolumeX aria-hidden="true" size={18} /> : <Volume2 aria-hidden="true" size={18} />}
            </button>
            <button
              aria-label="Remove YouTube Music"
              className="ml-auto grid size-10 place-items-center rounded-lg text-muted hover:bg-white/10 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              onClick={clearYouTubeAudio}
              type="button"
            >
              <Trash2 aria-hidden="true" size={18} />
            </button>
          </div>
          <Slider label="YouTube Music volume" value={volume} min={0} max={100} onChange={setVolume} />
        </div>
      ) : null}
    </section>
  )
}
