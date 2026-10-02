import { useState, type FormEvent } from 'react'
import { useBackgroundStore } from '@/store/useBackgroundStore'
import Slider from '@/components/ui/Slider'

type Tab = 'YouTube' | 'Image' | 'Presets'

export default function BackgroundPanel() {
  const [tab, setTab] = useState<Tab>('YouTube')
  const [url, setUrl] = useState(useBackgroundStore.getState().youtube?.url ?? '')
  const [error, setError] = useState('')
  const background = useBackgroundStore()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = background.setYouTube(url)
    setError(result.ok ? '' : result.message)
  }

  return (
    <div className="space-y-5">
      <div aria-label="Background choices" className="grid grid-cols-3 rounded-xl bg-white/[0.04] p-1" role="tablist">
        {(['YouTube', 'Image', 'Presets'] as const).map((option) => (
          <button
            aria-selected={tab === option}
            className={`rounded-lg px-2 py-2 text-xs transition-colors ${tab === option ? 'bg-white/10 text-text' : 'text-muted hover:text-text'}`}
            key={option}
            onClick={() => setTab(option)}
            role="tab"
            type="button"
          >
            {option}
          </button>
        ))}
      </div>

      {tab === 'YouTube' ? (
        <div className="space-y-5">
          <form className="space-y-2" onSubmit={submit}>
            <label className="sr-only" htmlFor="youtube-background-url">YouTube video URL</label>
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
                id="youtube-background-url"
                onChange={(event) => {
                  setUrl(event.currentTarget.value)
                  if (error) setError('')
                }}
                placeholder="Paste a YouTube link"
                value={url}
              />
              <button
                aria-label="Set YouTube background"
                className="rounded-xl bg-accent px-3 text-sm font-medium text-white hover:bg-accent/90"
                type="submit"
              >
                Enter
              </button>
            </div>
            {error && <p className="m-0 text-sm text-red-300" role="alert">{error}</p>}
          </form>

          {background.youtube && (
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2">
              <img
                alt=""
                className="h-14 w-24 rounded-lg object-cover"
                src={`https://i.ytimg.com/vi/${background.youtube.videoId}/mqdefault.jpg`}
              />
              <p className="m-0 line-clamp-2 text-sm text-text">
                {background.currentVideoTitle || 'YouTube background'}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                aria-label={background.videoPlaying ? 'Pause video' : 'Play video'}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.06]"
                onClick={() => background.setVideoPlaying(!background.videoPlaying)}
                type="button"
              >
                {background.videoPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                aria-label={background.videoMuted ? 'Unmute video' : 'Mute video'}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.06]"
                onClick={() => background.setVideoMuted(!background.videoMuted)}
                type="button"
              >
                {background.videoMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
            <Slider label="Video volume" min={0} max={100} value={background.videoVolume} onChange={background.setVideoVolume} />
            <Slider label="Brightness" min={0} max={200} value={background.brightness} onChange={background.setBrightness} />
            <Slider label="Blur" min={0} max={20} value={background.blur} onChange={background.setBlur} unit="px" />
            <Slider label="Overlay darkness" min={0} max={100} value={background.overlay} onChange={background.setOverlay} />
          </div>

          <div className="flex gap-2 border-t border-white/[0.08] pt-4">
            <button
              aria-label="Reset background controls"
              className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.06]"
              onClick={background.resetControls}
              type="button"
            >
              Reset
            </button>
            <button
              aria-label="Remove background"
              className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-sm text-muted hover:bg-white/[0.06] hover:text-text"
              onClick={background.clearBackground}
              type="button"
            >
              Remove background
            </button>
          </div>
        </div>
      ) : (
        <div className="glass px-5 py-8 text-center">
          <p className="m-0 text-sm font-medium text-text">Coming next</p>
          <p className="mb-0 mt-2 text-xs leading-5 text-muted">
            {tab} backgrounds will be available here soon.
          </p>
        </div>
      )}
    </div>
  )
}
