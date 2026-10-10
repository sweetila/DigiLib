import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initialRuntime } from '@/lib/timer/engine'
import { useAudioStore } from './useAudioStore'
import { useSessionStore } from './useSessionStore'
import { useTimerSettingsStore } from './useTimerSettingsStore'
import { migrate, useTimerStore } from './useTimerStore'

const storageKey = 'digilib-timer'

describe('useTimerStore', () => {
  beforeEach(() => {
    vi.useRealTimers()
    useTimerStore.setState({ ...initialRuntime(), lastEvent: null })
    useSessionStore.getState().clearSessions()
    useTimerSettingsStore.getState().resetSettings()
    useAudioStore.getState().stopAll()
    localStorage.removeItem(storageKey)
  })

  it('persists a running timestamp runtime and restores it after rehydrate', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(100_000)
    useTimerSettingsStore.getState().setMode('custom')
    useTimerSettingsStore.getState().setCustomConfig({
      focusMin: 1,
      shortBreakMin: 1,
      longBreakMin: 2,
      sessions: 4,
    })
    useTimerStore.getState().start({ subjectId: 'math' })
    expect(useTimerStore.getState()).toMatchObject({
      status: 'running',
      endTime: 160_000,
      subjectId: 'math',
    })

    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    const savedValue = localStorage.getItem(storageKey)
    expect(saved.state.lastEvent).toBeUndefined()
    useTimerStore.setState({ ...initialRuntime() })
    if (savedValue) localStorage.setItem(storageKey, savedValue)
    await useTimerStore.persist.rehydrate()
    expect(useTimerStore.getState()).toMatchObject({
      status: 'running',
      endTime: 160_000,
      startedAt: 100_000,
    })
  })

  it('logs focus activity and keeps the event only in memory', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    useTimerSettingsStore.getState().setMode('custom')
    useTimerSettingsStore.getState().setCustomConfig({
      focusMin: 25,
      shortBreakMin: 5,
      longBreakMin: 15,
      sessions: 4,
    })
    useTimerStore.getState().start()
    vi.setSystemTime(14 * 60_000)
    useTimerStore.getState().finish()
    expect(useSessionStore.getState().sessions[0]).toMatchObject({
      plannedSec: 1500,
      actualSec: 840,
      completed: false,
    })
  })

  it('does not persist no-op ticks before the timer changes phase', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    useTimerSettingsStore.getState().setMode('custom')
    useTimerSettingsStore.getState().setCustomConfig({
      focusMin: 1,
      shortBreakMin: 1,
      longBreakMin: 2,
      sessions: 4,
    })
    useTimerStore.getState().start()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const initialWrites = setItem.mock.calls.length
    useTimerStore.getState().tick(1_000)
    expect(setItem).toHaveBeenCalledTimes(initialWrites)
    setItem.mockRestore()
  })

  it('defaults to idle for corrupted, invalid, or unsupported runtime data', async () => {
    localStorage.setItem(storageKey, '{invalid json')
    await useTimerStore.persist.rehydrate()
    expect(useTimerStore.getState().status).toBe('idle')

    localStorage.setItem(storageKey, JSON.stringify({
      state: {
        schemaVersion: 1,
        ...initialRuntime(),
        status: 'running',
        plannedSec: 60,
        startedAt: 1,
        endTime: null,
      },
      version: 1,
    }))
    await useTimerStore.persist.rehydrate()
    expect(useTimerStore.getState().status).toBe('idle')
    expect(migrate({}, 99).status).toBe('idle')
  })
})
