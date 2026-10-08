import {
  addFilter,
  addGain,
  addLfo,
  addNoiseSource,
  createSource,
} from '../sourceUtils'
import { SOURCE_TUNING } from '../tuning'
import type { AudioSourceFactory } from '../sources'

export const windSource: AudioSourceFactory = (ctx, destination) => {
  const tuning = SOURCE_TUNING.wind
  return createSource(
    ctx,
    destination,
    tuning.baseGain,
    tuning.lowpassHz,
    (output, graph) => {
      const noise = addNoiseSource(ctx, graph, 'pink')
      const band = addFilter(
        ctx,
        graph,
        'bandpass',
        tuning.bandpassHz,
        tuning.bandpassQ,
      )
      const gustGain = addGain(ctx, graph, tuning.gustBaseGain)
      noise.connect(band)
      band.connect(gustGain)
      gustGain.connect(output)
      tuning.centerLfoRatesHz.forEach((rate, index) => {
        addLfo(
          ctx,
          graph,
          band.frequency,
          rate,
          tuning.centerLfoDepthsHz[index] ?? 0,
        )
      })
      tuning.gainLfoRatesHz.forEach((rate, index) => {
        addLfo(
          ctx,
          graph,
          gustGain.gain,
          rate,
          tuning.gainLfoDepths[index] ?? 0,
        )
      })

      const whistleBand = addFilter(
        ctx,
        graph,
        'bandpass',
        tuning.whistleHz,
        tuning.whistleQ,
      )
      const whistleGain = addGain(ctx, graph, tuning.whistleGain)
      noise.connect(whistleBand)
      whistleBand.connect(whistleGain)
      whistleGain.connect(output)
    },
  )
}
