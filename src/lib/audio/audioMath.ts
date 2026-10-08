export function randomRange(
  min: number,
  max: number,
  randomValue = Math.random(),
): number {
  const sample = Math.min(1, Math.max(0, randomValue))
  return min + (max - min) * sample
}

export function lookaheadWindow(
  currentTime: number,
  lookaheadSeconds: number,
): { start: number; end: number } {
  return { start: currentTime, end: currentTime + lookaheadSeconds }
}

export function scheduleTime(
  candidateTime: number,
  currentTime: number,
  minimumLeadSeconds: number,
): number {
  return Math.max(candidateTime, currentTime + minimumLeadSeconds)
}
