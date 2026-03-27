import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SpaceState {
  visitedRooms: string[]
  visitCount: number
  lastVisit: number | null
  unlockedSketches: number[]

  markVisited: (room: string) => void
  incrementVisits: () => void
  unlockSketch: (index: number) => void
}

export const useSpaceStore = create<SpaceState>()(
  persist(
    (set, get) => ({
      visitedRooms: [],
      visitCount: 0,
      lastVisit: null,
      unlockedSketches: [0],

      markVisited: (room: string) => {
        const { visitedRooms } = get()
        if (!visitedRooms.includes(room)) {
          set({ visitedRooms: [...visitedRooms, room] })
        }
      },

      incrementVisits: () => {
        set(state => ({
          visitCount: state.visitCount + 1,
          lastVisit: Date.now(),
        }))
      },

      unlockSketch: (index: number) => {
        const { unlockedSketches } = get()
        if (!unlockedSketches.includes(index)) {
          set({ unlockedSketches: [...unlockedSketches, index].sort((a, b) => a - b) })
        }
      },
    }),
    {
      name: 'personal-space-state',
    }
  )
)
