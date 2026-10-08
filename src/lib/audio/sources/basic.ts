import {
  addFilter,
  addGain,
  addLfo,
  addNoiseSource,
  createSource,
} from '../sourceUtils'
import { SOURCE_TUNING } from '../tuning'
import type { AudioSourceFactory } from '../sources'

export const whiteSource: AudioSourceFactory = (ctx, destination) => {
  const tuning = SOURCE_TUNING.white
  return createSource(
    ctx,
    destination,
    tuning.baseGain,
    tuning.lowpassHz,
    (output, graph) => {
      const noise = addNoiseSource(ctx, graph, 'white')
      let input: AudioNode = noise
      for (const frequency of tuning.tiltShelfHz) {
        const shelf = addFilter(ctx, graph, 'highshelf', frequency)
        shelf.gain.value = 20 * Math.log10(tuning.tiltShelfGain)
        input.connect(shelf)
        input = shelf
      }
      input.connect(output)
    },
  )
}

export const brownSource: AudioSourceFactory = (ctx, destination) => {
  const tuning = SOURCE_TUNING.brown
  return createSource(
    ctx,
    destination,
    tuning.baseGain,
    tuning.lowpassHz,
    (output, graph) => {
      const noise = addNoiseSource(ctx, graph, 'brown')
      const drift = addGain(ctx, graph, tuning.driftCenterGain)
      noise.connect(drift)
      drift.connect(output)
      addLfo(ctx, graph, drift.gain, tuning.driftRateHz, tuning.driftDepth)
    },
  )
}
