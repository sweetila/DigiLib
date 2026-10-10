import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { initialRuntime } from '@/lib/timer/engine'
import { useSessionStore } from '@/store/useSessionStore'
import { useTimerSettingsStore } from '@/store/useTimerSettingsStore'
import { useTimerStore } from '@/store/useTimerStore'
import FocusClock from './FocusClock'
import NoticeToast from '@/components/ui/NoticeToast'

function setOneMinuteFocus() {
  useTimerSettingsStore.getState().setMode('custom')
  useTimerSettingsStore.getState().setCustomConfig({
    focusMin: 1,
    shortBreakMin: 1,
    longBreakMin: 2,
    sessions: 4,
  })
}

describe('FocusClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    useTimerStore.setState({ ...initialRuntime(), lastEvent: null })
    useSessionStore.getState().clearSessions()
    useTimerSettingsStore.getState().resetSettings()
    localStorage.clear()
  })

  afterEach(() => vi.useRealTimers())

  it('shows the resolved idle duration and updates through start, pause, and resume', async () => {
    setOneMinuteFocus()
    render(<FocusClock />)
    expect(screen.getByRole('timer')).toHaveTextContent('01:00')
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(document.title).toBe('01:00 · Focus | DigiLib')
    await vi.advanceTimersByTimeAsync(1000)
    expect(screen.getByRole('timer')).toHaveTextContent('00:59')
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    await vi.advanceTimersByTimeAsync(5000)
    expect(screen.getByRole('timer')).toHaveTextContent('00:59')
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    await vi.advanceTimersByTimeAsync(1000)
    expect(screen.getByRole('timer')).toHaveTextContent('00:58')
  })

  it('logs a partial focus session when reset after the minimum duration', () => {
    setOneMinuteFocus()
    render(<><FocusClock /><NoticeToast /></>)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    vi.advanceTimersByTime(11_000)
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(useSessionStore.getState().sessions[0]).toMatchObject({ actualSec: 11, completed: false })
    expect(screen.getByText('Session saved. 11s logged.')).toBeInTheDocument()
  })

  it('offers break controls and shows overtime after the focus end time', async () => {
    setOneMinuteFocus()
    render(<FocusClock />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    await vi.advanceTimersByTimeAsync(65_000)
    expect(screen.getByRole('timer')).toHaveTextContent('+00:05')
    expect(screen.getByRole('button', { name: 'Start break' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finish session' })).toBeInTheDocument()
  })

  it('recognizes a restored running timer that is already overtime on mount', () => {
    setOneMinuteFocus()
    vi.setSystemTime(65_000)
    useTimerStore.setState({
      ...initialRuntime(),
      status: 'running',
      plannedSec: 60,
      startedAt: 0,
      endTime: 60_000,
      completedNotified: true,
    })
    render(<FocusClock />)
    expect(screen.getByRole('timer')).toHaveTextContent('+00:05')
  })
})
