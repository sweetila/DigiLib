import { Profiler, act } from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initialRuntime } from '@/lib/timer/engine'
import FocusClock from './FocusClock'
import TimerPanel from './Panel'
import PanelHost from '@/components/PanelHost'
import Toolbar from '@/components/Toolbar/Toolbar'
import { useTimerSettingsStore } from '@/store/useTimerSettingsStore'
import { useTimerStore } from '@/store/useTimerStore'

describe('timer tick render isolation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    useTimerStore.setState({ ...initialRuntime(), lastEvent: null })
    useTimerSettingsStore.getState().resetSettings()
    useTimerSettingsStore.getState().setMode('custom')
    useTimerSettingsStore.getState().setCustomConfig({
      focusMin: 1,
      shortBreakMin: 1,
      longBreakMin: 2,
      sessions: 4,
    })
    useTimerStore.getState().start()
  })

  it('keeps Toolbar, PanelHost, and TimerPanel out of 1-second clock commits', async () => {
    const renders = { toolbar: 0, panelHost: 0, timerPanel: 0 }
    render(
      <>
        <FocusClock />
        <Profiler id="toolbar" onRender={() => renders.toolbar++}><Toolbar /></Profiler>
        <Profiler id="panel-host" onRender={() => renders.panelHost++}><PanelHost /></Profiler>
        <Profiler id="timer-panel" onRender={() => renders.timerPanel++}><TimerPanel /></Profiler>
      </>,
    )
    const initialRenders = { ...renders }
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(renders).toEqual(initialRenders)
  })
})
