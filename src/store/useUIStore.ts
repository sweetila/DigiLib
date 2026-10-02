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
  openPanel: (panel: PanelId) => void
  togglePanel: (panel: PanelId) => void
  closePanel: () => void
  setFocusMode: (enabled: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activePanel: null,
  focusMode: false,
  shortcutsModalOpen: false,
  openPanel: (activePanel) => set({ activePanel }),
  togglePanel: (panel) =>
    set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  closePanel: () => set({ activePanel: null }),
  setFocusMode: (focusMode) => set({ focusMode }),
}))