import type { AudioSource } from './sources'
import { SOURCE_TUNING } from './tuning'
export {
  addFilter,
  addGain,
  addLfo,
  addNoiseBuffer,
  addNoiseSource,
} from './audioNodes'

export interface StartOptions {
  when?: number
  offset?: number
  duration?: number
}

export interface SourceGraph {
  addNode<T extends AudioNode>(node: T): T
  addSource<T extends AudioScheduledSourceNode>(
    source: T,
    options?: StartOptions,
    ownedNodes?: readonly AudioNode[],
  ): T
  addCleanup(cleanup: () => void): void
}

type SourceBuilder = (output: GainNode, graph: SourceGraph) => void

export function createSource(
  ctx: AudioContext,
  destination: AudioNode,
  baseGain: number,
  lowpassHz: number,
  build: SourceBuilder,
): AudioSource {
  const output = ctx.createGain()
  output.gain.value = 0
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = lowpassHz

  const nodes = new Set<AudioNode>([output, lowpass])
  const sources = new Map<
    AudioScheduledSourceNode,
    { options?: StartOptions; started: boolean }
  >()
  const cleanups = new Set<() => void>()
  let cleanupTimer: ReturnType<typeof setTimeout> | null = null
  let running = false
  let gain = 0

  const addNode = <T extends AudioNode>(node: T): T => {
    nodes.add(node)
    return node
  }
  const addSource = <T extends AudioScheduledSourceNode>(
    source: T,
    options?: StartOptions,
    ownedNodes: readonly AudioNode[] = [],
  ): T => {
    nodes.add(source)
    for (const node of ownedNodes) nodes.add(node)
    const record = { options, started: false }
    sources.set(source, record)
    source.onended = () => {
      source.disconnect()
      for (const node of ownedNodes) {
        node.disconnect()
        nodes.delete(node)
      }
      sources.delete(source)
      nodes.delete(source)
    }
    if (running) {
      try {
        startSource(ctx, source, record)
      } catch (error) {
        sources.delete(source)
        nodes.delete(source)
        source.disconnect()
        throw error
      }
    }
    return source
  }
  const addCleanup = (cleanup: () => void): void => {
    cleanups.add(cleanup)
  }

  const graph: SourceGraph = { addNode, addSource, addCleanup }
  const disconnectGraph = (): void => {
    for (const node of nodes) node.disconnect()
    nodes.clear()
    sources.clear()
  }

  return {
    start() {
      if (running) return
      if (cleanupTimer !== null) {
        clearTimeout(cleanupTimer)
        cleanupTimer = null
        for (const cleanup of cleanups) cleanup()
        cleanups.clear()
        for (const source of sources.keys()) source.stop()
        disconnectGraph()
      }
      try {
        build(output, graph)
        running = true
        lowpass.connect(destination)
        output.connect(lowpass)
        for (const [source, record] of sources) startSource(ctx, source, record)
        setTarget(ctx, output.gain, gain * baseGain)
      } catch (error) {
        running = false
        for (const cleanup of cleanups) cleanup()
        cleanups.clear()
        for (const [source, record] of sources) {
          if (record.started) source.stop()
        }
        disconnectGraph()
        throw error
      }
    },
    stop() {
      if (!running) return
      running = false
      setTarget(ctx, output.gain, 0)
      for (const cleanup of cleanups) cleanup()
      cleanups.clear()
      const stopAt = ctx.currentTime + SOURCE_TUNING.stopFadeSeconds
      for (const [source, record] of sources) {
        if (record.started) source.stop(stopAt)
      }
      cleanupTimer = setTimeout(
        () => {
          disconnectGraph()
          cleanupTimer = null
        },
        SOURCE_TUNING.stopFadeSeconds * 1000 + SOURCE_TUNING.cleanupTailMs,
      )
    },
    setGain(nextGain) {
      gain = clampGain(nextGain)
      if (running) setTarget(ctx, output.gain, gain * baseGain)
    },
  }
}

export function setTarget(
  ctx: AudioContext,
  param: AudioParam,
  value: number,
): void {
  param.setTargetAtTime(value, ctx.currentTime, SOURCE_TUNING.sourceRampSeconds)
}

export function clampGain(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

function startSource(
  ctx: AudioContext,
  source: AudioScheduledSourceNode,
  record: {
    options?: StartOptions
    started: boolean
  },
): void {
  if (record.started) return
  const options = record.options
  if (source instanceof AudioBufferSourceNode) {
    if (options?.duration !== undefined) {
      source.start(
        options.when ?? ctx.currentTime,
        options.offset ?? 0,
        options.duration,
      )
    } else if (options?.offset !== undefined) {
      source.start(options.when ?? ctx.currentTime, options.offset)
    } else {
      source.start(options?.when ?? ctx.currentTime)
    }
  } else {
    source.start(options?.when ?? ctx.currentTime)
    if (options?.duration !== undefined) {
      source.stop((options.when ?? ctx.currentTime) + options.duration)
    }
  }
  record.started = true
}
