import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SpaceState {
  visitedRooms: string[]
  visitCount: number
  lastVisit: number | null

  markVisited: (room: string) => void
  incrementVisits: () => void
}

export const useSpaceStore = create<SpaceState>()(
  persist(
    (set, get) => ({
      visitedRooms: [],
      visitCount: 0,
      lastVisit: null,

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
    }),
    {
      name: 'personal-space-state',
    }
  )
)
