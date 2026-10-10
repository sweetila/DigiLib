import { useEffect, useRef, useState } from 'react'
import YouTubeBackground from './YouTubeBackground'
import { useBackgroundStore } from '@/store/useBackgroundStore'

interface Layer {
  key: string
  type: 'gradient' | 'youtube'
  videoId?: string
  active: boolean
}

function gradientLayer(key: string, active: boolean): Layer {
  return { key, type: 'gradient', active }
}

export default function BackgroundLayer() {
  const type = useBackgroundStore((state) => state.type)
  const videoId = useBackgroundStore((state) => state.youtube?.videoId ?? null)
  const desiredKey = type === 'youtube' && videoId ? `youtube:${videoId}` : `gradient:${type}`
  const removalTimeout = useRef<number | null>(null)
  const [layers, setLayers] = useState<Layer[]>(() =>
    type === 'youtube' && videoId
      ? [
          gradientLayer('gradient:initial', true),
          { key: desiredKey, type: 'youtube', videoId, active: false },
        ]
      : [gradientLayer(desiredKey, true)],
  )

  useEffect(() => {
    if (removalTimeout.current !== null) window.clearTimeout(removalTimeout.current)
    const timeout = window.setTimeout(() => {
      setLayers((current) => {
        if (current.some((layer) => layer.key === desiredKey)) return current
        if (type !== 'youtube' || !videoId) {
          removalTimeout.current = window.setTimeout(() => {
            setLayers((layersNow) => layersNow.filter((layer) => layer.key === desiredKey))
          }, 850)
          return [...current.map((layer) => ({ ...layer, active: false })), gradientLayer(desiredKey, true)]
        }
        return [...current, { key: desiredKey, type: 'youtube', videoId, active: false }]
      })
    }, 0)
    return () => {
      window.clearTimeout(timeout)
      if (removalTimeout.current !== null) window.clearTimeout(removalTimeout.current)
    }
  }, [desiredKey, type, videoId])

  const promote = (key: string) => {
    setLayers((current) => {
      if (
        current.some((layer) => layer.key === key && layer.active) &&
        current.every((layer) => layer.key === key || !layer.active)
      ) {
        return current
      }
      return current.map((layer) => ({ ...layer, active: layer.key === key }))
    })
    if (removalTimeout.current !== null) window.clearTimeout(removalTimeout.current)
    removalTimeout.current = window.setTimeout(() => {
      setLayers((current) => current.filter((layer) => layer.key === key))
    }, 850)
  }

  useEffect(
    () => () => {
      if (removalTimeout.current !== null) window.clearTimeout(removalTimeout.current)
    },
    [],
  )

  return (
    <>
      <div className="fixed inset-0 overflow-hidden bg-bg">
        {layers.map((layer) =>
          layer.type === 'youtube' && layer.videoId ? (
            <YouTubeBackground
              active={layer.active}
              key={layer.key}
              videoId={layer.videoId}
              onPlaying={() => {
                if (desiredKey === layer.key) promote(layer.key)
              }}
            />
          ) : (
            <div
              aria-hidden="true"
              key={layer.key}
              className={`background-drift fixed -inset-[6%] bg-[radial-gradient(ellipse_at_19%_20%,rgba(195,166,208,0.14),transparent_47%),radial-gradient(ellipse_at_78%_76%,rgba(127,158,163,0.12),transparent_48%),linear-gradient(135deg,#0F0D0C_8%,#1A1613_52%,#0F0D0C_100%)] transition-opacity duration-[800ms] motion-reduce:duration-0 ${layer.active ? 'opacity-100' : 'opacity-0'}`}
            />
          ),
        )}
      </div>
    </>
  )
}