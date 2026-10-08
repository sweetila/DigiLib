import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useYouTubePlayer, type YouTubePlayerStatus } from '@/hooks/useYouTubePlayer'
import { shouldFallbackStillFrame } from '@/lib/youtube/stillFrame'
import { useBackgroundStore } from '@/store/useBackgroundStore'
import { useUIStore } from '@/store/useUIStore'

interface YouTubeBackgroundProps {
  videoId: string
  active: boolean
  onPlaying: () => void
}

export default function YouTubeBackground({ videoId, active, onPlaying }: YouTubeBackgroundProps) {
  const onPlayingRef = useRef(onPlaying)
  const containerRef = useRef<HTMLDivElement>(null)
  const muted = useBackgroundStore((state) => state.videoMuted)
  const volume = useBackgroundStore((state) => state.videoVolume)
  const playing = useBackgroundStore((state) => state.videoPlaying)
  const freezeToStill = useBackgroundStore((state) => state.freezeToStill)
  const isCurrentVideo = useBackgroundStore(
    (state) => state.type === 'youtube' && state.youtube?.videoId === videoId,
  )
  const startSeconds = useBackgroundStore((state) =>
    state.youtube?.videoId === videoId ? state.youtube.startSeconds : 0,
  )
  const brightness = useBackgroundStore((state) => state.brightness)
  const blur = useBackgroundStore((state) => state.blur)
  const setVideoPlaying = useBackgroundStore((state) => state.setVideoPlaying)
  const setFreezeToStill = useBackgroundStore((state) => state.setFreezeToStill)
  const setCurrentVideoTitle = useBackgroundStore((state) => state.setCurrentVideoTitle)
  const openPanel = useUIStore((state) => state.openPanel)
  const player = useYouTubePlayer({
    containerRef,
    videoId,
    startSeconds,
    muted,
    volume,
    loop: true,
    autoplay: playing && !freezeToStill,
  })

  useEffect(() => {
    onPlayingRef.current = onPlaying
    if (player.status === 'playing') onPlaying()
  }, [onPlaying, player.status])

  useEffect(() => {
    if (useBackgroundStore.getState().youtube?.videoId === videoId) {
      setCurrentVideoTitle(player.videoTitle)
    }
  }, [player.videoTitle, setCurrentVideoTitle, videoId])

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 transition-opacity duration-[800ms] motion-reduce:duration-0"
        style={{
          filter: `brightness(${brightness}%) blur(${blur}px)`,
          opacity: active ? 1 : 0,
        }}
      >
        <div
          ref={containerRef}
          className="absolute left-1/2 top-1/2 h-[max(56.25vh,56.25vw)] w-[max(100vw,177.78vh)] -translate-x-1/2 -translate-y-1/2 scale-[1.05] [&_iframe]:h-full [&_iframe]:w-full"
        />
        <StillFrameCover
          visible={
            freezeToStill ||
            !playing ||
            player.status === 'paused' ||
            player.status === 'ended'
          }
          videoId={videoId}
        />
      </div>
      {isCurrentVideo && (
        <BackgroundStatus
          errorMessage={player.errorMessage}
          onReplay={() => {
            setVideoPlaying(true)
            setFreezeToStill(false)
            player.replay()
          }}
          onChooseAnother={() => openPanel('background')}
          onPlay={() => {
            setFreezeToStill(false)
            player.play()
            setVideoPlaying(true)
          }}
          status={player.status}
        />
      )}
    </>
  )
}

interface StillFrameCoverProps {
  videoId: string
  visible: boolean
}

function StillFrameCover({ videoId, visible }: StillFrameCoverProps) {
  const [thumbnail, setThumbnail] = useState<'maxresdefault' | 'hqdefault'>('maxresdefault')

  return (
    <div
      aria-hidden="true"
      className={`absolute left-1/2 top-1/2 z-10 h-[max(56.25vh,56.25vw)] w-[max(100vw,177.78vh)] -translate-x-1/2 -translate-y-1/2 scale-[1.05] transition-opacity duration-[400ms] motion-reduce:duration-0 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <img
        alt=""
        className="h-full w-full object-cover"
        onError={() => setThumbnail('hqdefault')}
        onLoad={(event) => {
          if (
            thumbnail === 'maxresdefault' &&
            shouldFallbackStillFrame(event.currentTarget.naturalWidth)
          ) {
            setThumbnail('hqdefault')
          }
        }}
        src={`https://i.ytimg.com/vi/${videoId}/${thumbnail}.jpg`}
      />
    </div>
  )
}

interface BackgroundStatusProps {
  status: YouTubePlayerStatus
  errorMessage: string
  onPlay: () => void
  onChooseAnother: () => void
  onReplay: () => void
}

function BackgroundStatus({
  status,
  errorMessage,
  onPlay,
  onChooseAnother,
  onReplay,
}: BackgroundStatusProps) {
  if (status === 'ended') {
    return createPortal(
      <div className="fixed inset-0 z-[15] grid place-items-center">
        <button
          aria-label="Replay background video"
          className="glass rounded-xl px-5 py-3 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          onClick={onReplay}
          type="button"
        >
          Replay
        </button>
      </div>,
      document.body,
    )
  }
  if (!['loading', 'blocked', 'error'].includes(status)) return null

  const content =
    status === 'loading' ? (
      <p className="glass m-0 animate-pulse px-5 py-3 text-sm text-white/80">
        Loading environment...
      </p>
    ) : status === 'blocked' ? (
      <div className="glass max-w-md p-6 text-center">
        <p className="m-0 text-sm leading-6 text-white/85">
          Your browser blocked autoplay. Click to start your study room.
        </p>
        <button
          aria-label="Start study room video"
          className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          onClick={onPlay}
          type="button"
        >
          Start video
        </button>
      </div>
    ) : (
      <div className="glass max-w-md p-6 text-center">
        <p className="m-0 text-sm leading-6 text-white/85">{errorMessage}</p>
        <button
          aria-label="Choose another video"
          className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          onClick={onChooseAnother}
          type="button"
        >
          Choose another video
        </button>
      </div>
    )
  return createPortal(
    <div className="fixed inset-0 z-[15] grid place-items-center p-6">{content}</div>,
    document.body,
  )
}
