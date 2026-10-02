import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { loadYouTubeApi } from '@/lib/youtube/loadYouTubeApi'
import { parseYouTubeUrl } from '@/lib/youtube/parseYouTubeUrl'
import type { YouTubePlayer } from '@/types/youtube'

export type YouTubePlayerStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'blocked'
  | 'error'

interface UseYouTubePlayerOptions {
  containerRef: RefObject<HTMLDivElement | null>
  videoId: string
  muted: boolean
  volume: number
  loop: boolean
  autoplay: boolean
}

const errorMessages: Record<number, string> = {
  2: 'That YouTube video link is not valid. Try another one.',
  5: 'This video cannot be played in the browser. Try another one.',
  100: 'This video is unavailable or has been removed.',
  101: "This video can't be embedded. Try another one.",
  150: "This video can't be embedded. Try another one.",
}

export function useYouTubePlayer({
  containerRef,
  videoId,
  muted,
  volume,
  loop,
  autoplay,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<YouTubePlayer | null>(null)
  const latestOptions = useRef({ videoId, muted, volume, loop, autoplay })
  const loadedVideoId = useRef<string | null>(null)
  const hasValidVideoId = Boolean(parseYouTubeUrl(videoId))
  const [status, setStatus] = useState<YouTubePlayerStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [videoTitle, setVideoTitle] = useState('')

  useEffect(() => {
    latestOptions.current = { videoId, muted, volume, loop, autoplay }
  }, [videoId, muted, volume, loop, autoplay])

  const setPlayerVolume = useCallback((nextVolume: number) => {
    const player = playerRef.current
    if (player) player.setVolume(Math.min(100, Math.max(0, nextVolume)))
  }, [])
  const play = useCallback(() => {
    playerRef.current?.playVideo()
  }, [])
  const pause = useCallback(() => {
    playerRef.current?.pauseVideo()
  }, [])
  const togglePlay = useCallback(() => {
    if (playerRef.current?.getPlayerState() === window.YT?.PlayerState.PLAYING) pause()
    else play()
  }, [pause, play])
  const mute = useCallback(() => playerRef.current?.mute(), [])
  const unmute = useCallback(() => playerRef.current?.unMute(), [])
  const loadVideo = useCallback((id: string) => {
    const validId = parseYouTubeUrl(id)
    if (!validId) {
      playerRef.current?.pauseVideo()
      setVideoTitle('')
      setStatus('error')
      setErrorMessage('That YouTube video link is not valid. Try another one.')
      return
    }
    loadedVideoId.current = validId
    setVideoTitle('')
    setStatus('loading')
    playerRef.current?.loadVideoById(validId)
  }, [])

  useEffect(() => {
    let cancelled = false
    const requestedId = latestOptions.current.videoId
    if (!hasValidVideoId || !parseYouTubeUrl(requestedId)) {
      setErrorMessage('That YouTube video link is not valid. Try another one.')
      setStatus('error')
      return
    }
    if (!containerRef.current) return
    setStatus('loading')

    void loadYouTubeApi()
      .then((yt) => {
        if (cancelled || !containerRef.current) return
        const safeVideoId = parseYouTubeUrl(latestOptions.current.videoId)
        if (!safeVideoId) {
          setErrorMessage('That YouTube video link is not valid. Try another one.')
          setStatus('error')
          return
        }
        loadedVideoId.current = safeVideoId
        const player = new yt.Player(containerRef.current, {
          videoId: safeVideoId,
          width: '100%',
          height: '100%',
          playerVars: {
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
            fs: 0,
            loop: latestOptions.current.loop ? 1 : 0,
            ...(latestOptions.current.loop ? { playlist: safeVideoId } : {}),
            autoplay: latestOptions.current.autoplay ? 1 : 0,
          },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return
              playerRef.current = target
              setStatus('ready')
              if (latestOptions.current.muted) target.mute()
              else target.unMute()
              target.setVolume(Math.min(100, Math.max(0, latestOptions.current.volume)))
              setVideoTitle(target.getVideoData().title ?? '')
              if (latestOptions.current.autoplay) target.playVideo()
              window.setTimeout(() => {
                if (cancelled || !latestOptions.current.autoplay || statusIsActive(target)) return
                const state = target.getPlayerState()
                if (
                  state === yt.PlayerState.UNSTARTED ||
                  state === yt.PlayerState.CUED
                ) {
                  setStatus('blocked')
                }
              }, 1800)
            },
            onStateChange: ({ data, target }) => {
              if (cancelled) return
              if (data === yt.PlayerState.PLAYING) {
                setStatus('playing')
                setVideoTitle(target.getVideoData().title ?? '')
              } else if (data === yt.PlayerState.PAUSED) setStatus('paused')
              else if (data === yt.PlayerState.BUFFERING) setStatus('buffering')
              else if (data === yt.PlayerState.CUED || data === yt.PlayerState.UNSTARTED) {
                setStatus('ready')
              }
            },
            onError: ({ data }) => {
              if (cancelled) return
              setErrorMessage(errorMessages[data] ?? 'This video could not be played. Try another one.')
              setStatus('error')
            },
          },
        })
        playerRef.current = player
      })
      .catch(() => {
        if (cancelled) return
        setErrorMessage('YouTube could not be loaded. Check your connection and try again.')
        setStatus('error')
      })

    return () => {
      cancelled = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
    // The player is intentionally created once for this mounted container.
  }, [containerRef, hasValidVideoId])

  useEffect(() => {
    const safeId = parseYouTubeUrl(videoId)
    if (!safeId) {
      playerRef.current?.pauseVideo()
      return
    }
    if (!playerRef.current || safeId === loadedVideoId.current) return
    loadVideo(safeId)
  }, [videoId, loadVideo])

  useEffect(() => {
    if (!playerRef.current) return
    if (muted) playerRef.current.mute()
    else playerRef.current.unMute()
    setPlayerVolume(volume)
  }, [muted, volume, setPlayerVolume])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    if (autoplay) player.playVideo()
    else player.pauseVideo()
  }, [autoplay])

  return {
    status: hasValidVideoId ? status : 'error',
    errorMessage: hasValidVideoId
      ? errorMessage
      : 'That YouTube video link is not valid. Try another one.',
    videoTitle,
    play,
    pause,
    togglePlay,
    mute,
    unmute,
    setVolume: setPlayerVolume,
    loadVideo,
  }
}

function statusIsActive(player: YouTubePlayer): boolean {
  const state = player.getPlayerState()
  return (
    state === window.YT?.PlayerState.PLAYING ||
    state === window.YT?.PlayerState.BUFFERING ||
    state === window.YT?.PlayerState.PAUSED
  )
}
