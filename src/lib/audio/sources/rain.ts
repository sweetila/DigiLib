import { randomRange, scheduleTime } from '../audioMath'
import { startLookaheadScheduler } from '../scheduler'
import {
  addFilter,
  addGain,
  addNoiseBuffer,
  addNoiseSource,
  createSource,
  type SourceGraph,
} from '../sourceUtils'
import { SOURCE_TUNING } from '../tuning'
import type { AudioSourceFactory } from '../sources'

export const rainSource: AudioSourceFactory = (ctx, destination) => {
  const tuning = SOURCE_TUNING.rain
  return createSource(
    ctx,
    destination,
    tuning.baseGain,
    tuning.lowpassHz,
    (output, graph) => {
      addWash(ctx, graph, output)
      addRumble(ctx, graph, output)
      const droplets = addNoiseBuffer(ctx, 'white')
      let nextDropAt =
        ctx.currentTime +
        randomRange(1 / tuning.dropletRateMaxHz, 1 / tuning.dropletRateMinHz)

      startLookaheadScheduler(ctx, graph, SOURCE_TUNING.scheduler, (window) => {
        while (nextDropAt <= window.end) {
          const at = scheduleTime(
            nextDropAt,
            ctx.currentTime,
            SOURCE_TUNING.scheduler.minimumLeadSeconds,
          )
          scheduleDroplet(ctx, graph, output, droplets, at)
          nextDropAt =
            at +
            randomRange(
              1 / tuning.dropletRateMaxHz,
              1 / tuning.dropletRateMinHz,
            )
        }
      })
    },
  )
}

function addWash(
  ctx: AudioContext,
  graph: SourceGraph,
  output: AudioNode,
): void {
  const tuning = SOURCE_TUNING.rain
  const noise = addNoiseSource(ctx, graph, 'pink')
  const band = addFilter(
    ctx,
    graph,
    'bandpass',
    Math.sqrt(tuning.washLowHz * tuning.washHighHz),
    Math.sqrt(tuning.washLowHz * tuning.washHighHz) /
      (tuning.washHighHz - tuning.washLowHz),
  )
  const gain = addGain(ctx, graph, tuning.washGain)
  noise.connect(band)
  band.connect(gain)
  gain.connect(output)
}

function addRumble(
  ctx: AudioContext,
  graph: SourceGraph,
  output: AudioNode,
): void {
  const tuning = SOURCE_TUNING.rain
  const noise = addNoiseSource(ctx, graph, 'brown')
  const band = addFilter(
    ctx,
    graph,
    'bandpass',
    Math.sqrt(tuning.rumbleLowHz * tuning.rumbleHighHz),
    tuning.rumbleQ,
  )
  const gain = addGain(ctx, graph, tuning.rumbleGain)
  noise.connect(band)
  band.connect(gain)
  gain.connect(output)
}

function scheduleDroplet(
  ctx: AudioContext,
  graph: SourceGraph,
  output: AudioNode,
  buffer: AudioBuffer,
  when: number,
): void {
  const tuning = SOURCE_TUNING.rain
  const duration = randomRange(
    tuning.dropletDurationMinSeconds,
    tuning.dropletDurationMaxSeconds,
  )
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = randomRange(
    tuning.dropletPitchMin,
    tuning.dropletPitchMax,
  )
  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = randomRange(
    tuning.dropletHighpassMinHz,
    tuning.dropletHighpassMaxHz,
  )
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = tuning.dropletLowpassHz
  const envelope = ctx.createGain()
  envelope.gain.value = tuning.dropletGain
  const panner = ctx.createStereoPanner()
  panner.pan.value = randomRange(tuning.dropletPanMin, tuning.dropletPanMax)
  source.disconnect()
  source.connect(highpass)
  highpass.connect(lowpass)
  lowpass.connect(envelope)
  envelope.connect(panner)
  panner.connect(output)
  envelope.gain.setValueAtTime(tuning.dropletGain, when)
  envelope.gain.exponentialRampToValueAtTime(
    SOURCE_TUNING.envelopeFloorGain,
    when + tuning.dropletDecaySeconds,
  )
  graph.addSource(
    source,
    {
      when,
      offset: randomRange(0, tuning.dropletOffsetMaxSeconds),
      duration,
    },
    [highpass, lowpass, envelope, panner],
  )
}
