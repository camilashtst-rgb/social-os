import { create } from 'zustand'
import type { Settings } from '../types'

interface AppStore {
  clientFilter: string | null
  setClientFilter: (id: string | null) => void
  settings: Settings | null
  setSettings: (s: Settings) => void
  notificationCount: number
  setNotificationCount: (n: number) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  clientFilter: null,
  setClientFilter: (id) => set({ clientFilter: id }),
  settings: null,
  setSettings: (s) => set({ settings: s }),
  notificationCount: 0,
  setNotificationCount: (n) => set({ notificationCount: n }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}))
