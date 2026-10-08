import { lookaheadWindow } from './audioMath'
import type { SourceGraph } from './sourceUtils'

export interface SchedulerTuning {
  tickMs: number
  lookaheadSeconds: number
}

export function startLookaheadScheduler(
  ctx: AudioContext,
  graph: SourceGraph,
  tuning: SchedulerTuning,
  schedule: (window: { start: number; end: number }) => void,
): void {
  let timer: ReturnType<typeof setTimeout>
  let stopped = false
  const tick = (): void => {
    if (stopped) return
    schedule(lookaheadWindow(ctx.currentTime, tuning.lookaheadSeconds))
    timer = setTimeout(tick, tuning.tickMs)
  }

  graph.addCleanup(() => {
    stopped = true
    clearTimeout(timer)
  })
  timer = setTimeout(tick, 0)
}
