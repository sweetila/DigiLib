import { SOURCE_TUNING } from '../tuning'
import type { AudioSourceFactory } from '../sources'

const oceanNoiseUrl = '/ocean-noise.mp3'

export const oceanSource: AudioSourceFactory = (ctx, destination) => {
  const gainNode = ctx.createGain()
  gainNode.gain.value = 0

  const mediaElement = new Audio(oceanNoiseUrl)
  mediaElement.loop = true
  mediaElement.preload = 'auto'

  const mediaSource = ctx.createMediaElementSource(mediaElement)
  mediaSource.connect(gainNode)
  gainNode.connect(destination)

  let gain = 1
  let started = false

  return {
    start() {
      if (started) {
        if (mediaElement.paused) {
          void mediaElement.play()
        }
        return
      }

      started = true
      const now = ctx.currentTime
      gainNode.gain.setValueAtTime(0, now)
      void mediaElement.play().catch((error) => {
        console.error('Unable to play ocean noise', error)
      })
      gainNode.gain.setTargetAtTime(
        gain,
        now,
        SOURCE_TUNING.sourceRampSeconds,
      )
    },
    stop() {
      if (!started) return

      started = false
      mediaElement.pause()
      mediaElement.currentTime = 0
      gainNode.gain.setTargetAtTime(
        0,
        ctx.currentTime,
        SOURCE_TUNING.sourceRampSeconds,
      )
    },
    setGain(nextGain) {
      gain = Number.isFinite(nextGain) ? Math.min(1, Math.max(0, nextGain)) : 0
      if (started) {
        gainNode.gain.setTargetAtTime(
          gain,
          ctx.currentTime,
          SOURCE_TUNING.sourceRampSeconds,
        )
      }
    },
  }
}
