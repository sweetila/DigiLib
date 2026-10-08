import { randomRange } from '../audioMath'
import { startLookaheadScheduler } from '../scheduler'
import {
  addFilter,
  addGain,
  addNoiseSource,
  createSource,
} from '../sourceUtils'
import { SOURCE_TUNING } from '../tuning'
import type { AudioSourceFactory } from '../sources'

export const oceanSource: AudioSourceFactory = (ctx, destination) => {
  const tuning = SOURCE_TUNING.ocean
  return createSource(
    ctx,
    destination,
    tuning.baseGain,
    tuning.lowpassHz,
    (output, graph) => {
      const brown = addNoiseSource(ctx, graph, 'brown')
      const swellFilter = addFilter(ctx, graph, 'lowpass', tuning.swellHighHz)
      const swellGain = addGain(ctx, graph, tuning.swellFloor)
      brown.connect(swellFilter)
      swellFilter.connect(swellGain)
      swellGain.connect(output)

      const white = addNoiseSource(ctx, graph, 'white')
      const foamHighpass = addFilter(
        ctx,
        graph,
        'highpass',
        tuning.foamHighpassHz,
      )
      const foamLowpass = addFilter(ctx, graph, 'lowpass', tuning.foamLowpassHz)
      const foamGain = addGain(ctx, graph, 0)
      white.connect(foamHighpass)
      foamHighpass.connect(foamLowpass)
      foamLowpass.connect(foamGain)
      foamGain.connect(output)

      let nextSwellAt =
        ctx.currentTime + SOURCE_TUNING.scheduler.minimumLeadSeconds
      startLookaheadScheduler(ctx, graph, SOURCE_TUNING.scheduler, (window) => {
        while (nextSwellAt <= window.end) {
          const cycle = randomRange(
            tuning.cycleMinSeconds,
            tuning.cycleMaxSeconds,
          )
          const crestAt = nextSwellAt + cycle * tuning.swellCrestFraction
          const endAt = nextSwellAt + cycle
          swellGain.gain.setValueAtTime(tuning.swellFloor, nextSwellAt)
          swellGain.gain.linearRampToValueAtTime(tuning.swellPeak, crestAt)
          swellGain.gain.linearRampToValueAtTime(tuning.swellFloor, endAt)
          foamGain.gain.setValueAtTime(0, nextSwellAt)
          foamGain.gain.linearRampToValueAtTime(tuning.foamGain, crestAt)
          foamGain.gain.linearRampToValueAtTime(0, endAt)
          swellFilter.frequency.setValueAtTime(tuning.swellLowHz, nextSwellAt)
          swellFilter.frequency.linearRampToValueAtTime(
            tuning.swellHighHz,
            crestAt,
          )
          swellFilter.frequency.linearRampToValueAtTime(
            tuning.swellLowHz,
            endAt,
          )
          nextSwellAt = endAt
        }
      })
    },
  )
}
