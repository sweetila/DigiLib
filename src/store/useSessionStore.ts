import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { z } from 'zod'
import type { SessionDraft } from '@/lib/timer/engine'

const sessionSchema = z.object({
  id: z.string().min(1),
  startedAt: z.number().finite(),
  plannedSec: z.number().int().positive(),
  actualSec: z.number().int().nonnegative(),
  completed: z.boolean(),
  subjectId: z.string().optional(),
  taskId: z.string().optional(),
  soundscapeName: z.string().optional(),
})

const sessionStoreSchema = z.object({
  schemaVersion: z.literal(1),
  sessions: z.array(sessionSchema),
})

export interface SessionEntry extends SessionDraft {
  id: string
}

interface SessionData {
  schemaVersion: 1
  sessions: SessionEntry[]
}

interface SessionState extends SessionData {
  addSession: (draft: SessionDraft) => void
  clearSessions: () => void
}

const defaultData: SessionData = { schemaVersion: 1, sessions: [] }

export function migrate(persisted: unknown, version: number): SessionData {
  if (version !== 1) return defaultData
  const result = sessionStoreSchema.safeParse(persisted)
  return result.success ? result.data : defaultData
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...defaultData,
      addSession: (draft) => set((state) => ({
        sessions: [...state.sessions, { ...draft, id: createSessionId() }],
      })),
      clearSessions: () => set({ sessions: [] }),
    }),
    {
      name: 'digilib-sessions',
      version: defaultData.schemaVersion,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        sessions: state.sessions,
      }),
      migrate: (persisted, version) => migrate(persisted, version) as SessionState,
      merge: (persisted, current) => {
        const result = sessionStoreSchema.safeParse(persisted)
        return result.success
          ? { ...current, ...result.data }
          : { ...current, ...defaultData }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) useSessionStore.setState(defaultData)
      },
    },
  ),
)

function createSessionId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
