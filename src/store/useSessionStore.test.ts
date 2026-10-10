import { beforeEach, describe, expect, it } from 'vitest'
import { migrate, useSessionStore } from './useSessionStore'

const storageKey = 'digilib-sessions'

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().clearSessions()
    localStorage.removeItem(storageKey)
  })

  it('adds session entries and persists them', async () => {
    useSessionStore.getState().addSession({
      startedAt: 1000,
      plannedSec: 1500,
      actualSec: 840,
      completed: false,
      subjectId: 'history',
    })
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    expect(saved.state.sessions).toHaveLength(1)
    expect(saved.state.sessions[0]).toMatchObject({
      startedAt: 1000,
      plannedSec: 1500,
      actualSec: 840,
      completed: false,
      subjectId: 'history',
    })
    await useSessionStore.persist.rehydrate()
    expect(useSessionStore.getState().sessions).toHaveLength(1)
    useSessionStore.getState().clearSessions()
    expect(useSessionStore.getState().sessions).toEqual([])
  })

  it('defaults on corruption, invalid entries, and unsupported migration versions', async () => {
    localStorage.setItem(storageKey, '{invalid json')
    await useSessionStore.persist.rehydrate()
    expect(useSessionStore.getState().sessions).toEqual([])

    localStorage.setItem(storageKey, JSON.stringify({
      state: {
        schemaVersion: 1,
        sessions: [{ id: 'bad', startedAt: 1, plannedSec: -1, actualSec: 0, completed: false }],
      },
      version: 1,
    }))
    await useSessionStore.persist.rehydrate()
    expect(useSessionStore.getState().sessions).toEqual([])
    expect(migrate({}, 99).sessions).toEqual([])
  })
})
