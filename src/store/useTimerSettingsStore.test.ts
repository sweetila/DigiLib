import { beforeEach, describe, expect, it } from 'vitest'
import { resolveConfig, useTimerSettingsStore, migrate } from './useTimerSettingsStore'

const storageKey = 'digilib-timer-settings'

describe('useTimerSettingsStore', () => {
  beforeEach(() => {
    useTimerSettingsStore.getState().resetSettings()
    localStorage.removeItem(storageKey)
  })

  it('persists mode, custom durations, and toggles', async () => {
    const store = useTimerSettingsStore.getState()
    store.setMode('custom')
    store.setCustomConfig({ focusMin: 40, shortBreakMin: 8, longBreakMin: 25, sessions: 5 })
    store.setToggle('autoStartBreaks', true)
    expect(resolveConfig(useTimerSettingsStore.getState())).toMatchObject({
      focusMin: 40,
      shortBreakMin: 8,
      longBreakMin: 25,
      sessions: 5,
      autoStartBreaks: true,
    })
    expect(JSON.parse(localStorage.getItem(storageKey) ?? '{}').state).toMatchObject({
      schemaVersion: 1,
      mode: 'custom',
      custom: { focusMin: 40, sessions: 5 },
    })
    await useTimerSettingsStore.persist.rehydrate()
    expect(useTimerSettingsStore.getState().mode).toBe('custom')
  })

  it('resolves preset durations with the separately saved toggles', () => {
    useTimerSettingsStore.getState().setMode('deep-90')
    useTimerSettingsStore.getState().setToggle('desktopNotification', true)
    expect(resolveConfig(useTimerSettingsStore.getState())).toMatchObject({
      focusMin: 90,
      shortBreakMin: 20,
      longBreakMin: 30,
      sessions: 3,
      desktopNotification: true,
    })
  })

  it('defaults after corrupted or invalid persisted settings', async () => {
    localStorage.setItem(storageKey, '{invalid json')
    await useTimerSettingsStore.persist.rehydrate()
    expect(useTimerSettingsStore.getState().mode).toBe('pomodoro')

    localStorage.setItem(storageKey, JSON.stringify({
      state: {
        schemaVersion: 1,
        mode: 'unknown',
        custom: { focusMin: 25, shortBreakMin: 5, longBreakMin: 15, sessions: 4 },
        autoStartBreaks: false,
        autoStartFocus: false,
        soundNotification: true,
        desktopNotification: false,
      },
      version: 1,
    }))
    await useTimerSettingsStore.persist.rehydrate()
    expect(useTimerSettingsStore.getState().mode).toBe('pomodoro')
    expect(migrate({}, 99).mode).toBe('pomodoro')
  })
})
