import { create } from 'zustand'

export type PanelId =
  | 'timer'
  | 'tasks'
  | 'sounds'
  | 'notes'
  | 'stats'
  | 'background'
  | 'scenes'
  | 'settings'

interface UIState {
  activePanel: PanelId | null
  focusMode: boolean
  shortcutsModalOpen: boolean
  notice: { id: number; message: string } | null
  openPanel: (panel: PanelId) => void
  togglePanel: (panel: PanelId) => void
  closePanel: () => void
  setFocusMode: (enabled: boolean) => void
  showNotice: (message: string) => void
  dismissNotice: () => void
}

let noticeId = 0

export const useUIStore = create<UIState>((set) => ({
  activePanel: null,
  focusMode: false,
  shortcutsModalOpen: false,
  notice: null,
  openPanel: (activePanel) => set({ activePanel }),
  togglePanel: (panel) =>
    set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  closePanel: () => set({ activePanel: null }),
  setFocusMode: (focusMode) => set({ focusMode }),
  showNotice: (message) => set({ notice: { id: ++noticeId, message } }),
  dismissNotice: () => set({ notice: null }),
}))