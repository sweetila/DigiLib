import { randomRange, scheduleTime } from '../audioMath'
import { startLookaheadScheduler } from '../scheduler'
import {
  addFilter,
  addGain,
  addNoiseSource,
  createSource,
  type SourceGraph,
} from '../sourceUtils'
import { SOURCE_TUNING } from '../tuning'
import type { AudioSourceFactory } from '../sources'

export const cafeSource: AudioSourceFactory = (ctx, destination) => {
  const tuning = SOURCE_TUNING.cafe
  return createSource(
    ctx,
    destination,
    tuning.baseGain,
    tuning.lowpassHz,
    (output, graph) => {
      const murmur = addNoiseSource(ctx, graph, 'pink')
      const formants: BiquadFilterNode[] = []
      tuning.formantsHz.forEach((frequency, index) => {
        const band = addFilter(
          ctx,
          graph,
          'bandpass',
          frequency,
          tuning.formantQ,
        )
        formants.push(band)
        const formantGain = addGain(ctx, graph, tuning.formantGains[index] ?? 0)
        murmur.connect(band)
        band.connect(formantGain)
        formantGain.connect(output)
      })

      const nextFormantSweepAt = tuning.formantsHz.map(
        () =>
          ctx.currentTime +
          randomRange(
            tuning.formantSweepMinIntervalSeconds,
            tuning.formantSweepMaxIntervalSeconds,
          ),
      )
      let nextClinkAt =
        ctx.currentTime +
        randomRange(
          tuning.clinkMinIntervalSeconds,
          tuning.clinkMaxIntervalSeconds,
        )

      startLookaheadScheduler(ctx, graph, SOURCE_TUNING.scheduler, (window) => {
        for (const [index, band] of formants.entries()) {
          while ((nextFormantSweepAt[index] ?? Infinity) <= window.end) {
            const nextAt = nextFormantSweepAt[index] ?? window.end
            const at = scheduleTime(
              nextAt,
              ctx.currentTime,
              SOURCE_TUNING.scheduler.minimumLeadSeconds,
            )
            const center = tuning.formantsHz[index] ?? 0
            const depth = tuning.formantSweepDepthHz[index] ?? 0
            band.frequency.setTargetAtTime(
              randomRange(center - depth, center + depth),
              at,
              tuning.formantSweepTimeConstantSeconds,
            )
            nextFormantSweepAt[index] =
              at +
              randomRange(
                tuning.formantSweepMinIntervalSeconds,
                tuning.formantSweepMaxIntervalSeconds,
              )
          }
        }

        while (nextClinkAt <= window.end) {
          const at = scheduleTime(
            nextClinkAt,
            ctx.currentTime,
            SOURCE_TUNING.scheduler.minimumLeadSeconds,
          )
          scheduleClink(ctx, graph, output, at)
          nextClinkAt =
            at +
            randomRange(
              tuning.clinkMinIntervalSeconds,
              tuning.clinkMaxIntervalSeconds,
            )
        }
      })
    },
  )
}

function scheduleClink(
  ctx: AudioContext,
  graph: SourceGraph,
  output: AudioNode,
  when: number,
): void {
  const tuning = SOURCE_TUNING.cafe
  const oscillator = ctx.createOscillator()
  oscillator.type = 'sine'
  oscillator.frequency.value = randomRange(tuning.clinkMinHz, tuning.clinkMaxHz)
  const envelope = ctx.createGain()
  envelope.gain.value = tuning.clinkGain
  const panner = ctx.createStereoPanner()
  panner.pan.value = randomRange(tuning.clinkPanMin, tuning.clinkPanMax)
  oscillator.connect(envelope)
  envelope.connect(panner)
  panner.connect(output)
  envelope.gain.setValueAtTime(tuning.clinkGain, when)
  envelope.gain.exponentialRampToValueAtTime(
    tuning.clinkFloorGain,
    when + tuning.clinkDecaySeconds,
  )
  graph.addSource(oscillator, { when, duration: tuning.clinkDurationSeconds }, [
    envelope,
    panner,
  ])
}
