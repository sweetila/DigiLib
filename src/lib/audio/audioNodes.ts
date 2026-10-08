import { fillBrown, fillPink, fillStereoNoise, fillWhite } from './noise'
import type { SourceGraph } from './sourceUtils'
import { SOURCE_TUNING } from './tuning'

type NoiseColor = 'white' | 'pink' | 'brown'

export function addNoiseBuffer(
  ctx: AudioContext,
  color: NoiseColor,
): AudioBuffer {
  const length = Math.ceil(ctx.sampleRate * SOURCE_TUNING.noiseBufferSeconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  const left = new Float32Array(length)
  const right = new Float32Array(length)
  const fill =
    color === 'white' ? fillWhite : color === 'pink' ? fillPink : fillBrown
  fillStereoNoise(left, right, fill)
  buffer.copyToChannel(left, 0)
  buffer.copyToChannel(right, 1)
  return buffer
}

export function addNoiseSource(
  ctx: AudioContext,
  graph: SourceGraph,
  color: NoiseColor,
  looping = true,
  when?: number,
  offset?: number,
  duration?: number,
): AudioBufferSourceNode {
  const source = graph.addSource(ctx.createBufferSource(), {
    when,
    offset,
    duration,
  })
  source.buffer = addNoiseBuffer(ctx, color)
  source.loop = looping
  return source
}

export function addFilter(
  ctx: AudioContext,
  graph: SourceGraph,
  type: BiquadFilterType,
  frequency: number,
  q?: number,
): BiquadFilterNode {
  const filter = graph.addNode(ctx.createBiquadFilter())
  filter.type = type
  filter.frequency.value = frequency
  if (q !== undefined) filter.Q.value = q
  return filter
}

export function addGain(
  ctx: AudioContext,
  graph: SourceGraph,
  value: number,
): GainNode {
  const node = graph.addNode(ctx.createGain())
  node.gain.value = value
  return node
}

export function addLfo(
  ctx: AudioContext,
  graph: SourceGraph,
  target: AudioParam,
  frequency: number,
  depth: number,
): void {
  const oscillator = graph.addSource(ctx.createOscillator())
  const amount = addGain(ctx, graph, depth)
  oscillator.frequency.value = frequency
  oscillator.connect(amount)
  amount.connect(target)
}
