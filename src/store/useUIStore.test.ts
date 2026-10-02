import { beforeEach, describe, expect, it } from 'vitest'
import { useUIStore } from './useUIStore'

describe('useUIStore panel actions', () => {
  beforeEach(() => {
    useUIStore.setState({ activePanel: null })
  })

  it('opens a panel', () => {
    useUIStore.getState().openPanel('timer')
    expect(useUIStore.getState().activePanel).toBe('timer')
  })

  it('toggles the active panel closed and another panel open', () => {
    useUIStore.getState().togglePanel('tasks')
    expect(useUIStore.getState().activePanel).toBe('tasks')
    useUIStore.getState().togglePanel('tasks')
    expect(useUIStore.getState().activePanel).toBeNull()
    useUIStore.getState().togglePanel('notes')
    expect(useUIStore.getState().activePanel).toBe('notes')
  })

  it('closes an open panel', () => {
    useUIStore.getState().openPanel('settings')
    useUIStore.getState().closePanel()
    expect(useUIStore.getState().activePanel).toBeNull()
  })
})