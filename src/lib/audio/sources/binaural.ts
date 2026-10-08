import {
  addFilter,
  addGain,
  addLfo,
  addNoiseSource,
  createSource,
} from '../sourceUtils'
import { SOURCE_TUNING } from '../tuning'
import type { AudioSourceFactory } from '../sources'

export const deltaSource: AudioSourceFactory = (ctx, destination) => {
  const tuning = SOURCE_TUNING.delta
  return createSource(
    ctx,
    destination,
    tuning.baseGain,
    tuning.lowpassHz,
    (output, graph) => {
      const voice = addGain(
        ctx,
        graph,
        tuning.swellCenterGain - tuning.swellDepth,
      )
      voice.connect(output)
      addLfo(ctx, graph, voice.gain, tuning.swellRateHz, tuning.swellDepth)

      const merger = graph.addNode(ctx.createChannelMerger(2))
      const left = graph.addSource(ctx.createOscillator())
      const right = graph.addSource(ctx.createOscillator())
      left.frequency.value = tuning.carrierHz
      right.frequency.value = tuning.carrierHz + tuning.beatHz
      left.connect(merger, 0, 0)
      right.connect(merger, 0, 1)
      merger.connect(voice)

      tuning.padDetuneCents.forEach((detune, index) => {
        const pad = graph.addSource(ctx.createOscillator())
        const padGain = addGain(
          ctx,
          graph,
          tuning.padGain / tuning.padDetuneCents.length,
        )
        const panner = graph.addNode(ctx.createStereoPanner())
        pad.frequency.value = tuning.carrierHz * tuning.padFrequencyRatio
        pad.detune.value = detune
        panner.pan.value = tuning.padPan[index] ?? 0
        pad.connect(padGain)
        padGain.connect(panner)
        panner.connect(voice)
      })

      const brown = addNoiseSource(ctx, graph, 'brown')
      const brownLowpass = addFilter(
        ctx,
        graph,
        'lowpass',
        tuning.brownLowpassHz,
      )
      const brownGain = addGain(ctx, graph, tuning.brownPadGain)
      brown.connect(brownLowpass)
      brownLowpass.connect(brownGain)
      brownGain.connect(voice)
    },
  )
}

export const thetaSource: AudioSourceFactory = (ctx, destination) => {
  const tuning = SOURCE_TUNING.theta
  return createSource(
    ctx,
    destination,
    tuning.baseGain,
    tuning.lowpassHz,
    (output, graph) => {
      const voice = addGain(
        ctx,
        graph,
        tuning.swellCenterGain - tuning.swellDepth,
      )
      voice.connect(output)
      addLfo(ctx, graph, voice.gain, tuning.swellRateHz, tuning.swellDepth)

      const merger = graph.addNode(ctx.createChannelMerger(2))
      const left = graph.addSource(ctx.createOscillator())
      const right = graph.addSource(ctx.createOscillator())
      left.frequency.value = tuning.carrierHz
      right.frequency.value = tuning.carrierHz + tuning.beatHz
      left.connect(merger, 0, 0)
      right.connect(merger, 0, 1)
      merger.connect(voice)

      tuning.padDetuneCents.forEach((detune, index) => {
        const pad = graph.addSource(ctx.createOscillator())
        const padGain = addGain(
          ctx,
          graph,
          tuning.padGain / tuning.padDetuneCents.length,
        )
        const panner = graph.addNode(ctx.createStereoPanner())
        pad.frequency.value = tuning.carrierHz * tuning.padFrequencyRatio
        pad.detune.value = detune
        panner.pan.value = tuning.padPan[index] ?? 0
        pad.connect(padGain)
        padGain.connect(panner)
        panner.connect(voice)
      })

      const brown = addNoiseSource(ctx, graph, 'brown')
      const brownLowpass = addFilter(
        ctx,
        graph,
        'lowpass',
        tuning.brownLowpassHz,
      )
      const brownGain = addGain(ctx, graph, tuning.brownPadGain)
      brown.connect(brownLowpass)
      brownLowpass.connect(brownGain)
      brownGain.connect(voice)
      addLfo(
        ctx,
        graph,
        brownLowpass.frequency,
        tuning.filterSweepRateHz,
        tuning.filterSweepDepthHz,
      )
    },
  )
}
