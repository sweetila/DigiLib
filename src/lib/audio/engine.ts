import { audioSources, type AudioSourceId } from './sources'

const RAMP_SECONDS = 0.05

export class AudioEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private readonly active = new Map<AudioSourceId, ReturnType<(typeof audioSources)[AudioSourceId]>>()
  private readonly volumes = new Map<AudioSourceId, number>()
  private masterGain = 1

  async start(id: AudioSourceId): Promise<void> {
    const context = this.ensureContext()
    if (context.state !== 'running') await context.resume()
    if (this.active.has(id)) return

    const master = this.master
    if (!master) throw new Error('Audio master is unavailable')
    const source = audioSources[id](context, master)
    source.start()
    source.setGain(this.volumes.get(id) ?? 1)
    this.active.set(id, source)
  }

  stop(id: AudioSourceId): void {
    const source = this.active.get(id)
    if (!source) return
    source.stop()
    this.active.delete(id)
  }

  setVolume(id: AudioSourceId, gain: number): void {
    const volume = clampGain(gain)
    this.volumes.set(id, volume)
    this.active.get(id)?.setGain(volume)
  }

  setMaster(gain: number): void {
    this.masterGain = clampGain(gain)
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(
        this.masterGain,
        this.context.currentTime,
        RAMP_SECONDS,
      )
    }
  }

  async dispose(): Promise<void> {
    for (const [id, source] of this.active) {
      source.stop()
      this.active.delete(id)
    }
    if (!this.context) return

    const context = this.context
    this.master?.disconnect()
    this.master = null
    this.context = null
    await context.close()
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = this.masterGain
      this.master.connect(this.context.destination)
    }
    return this.context
  }
}

function clampGain(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}
