import { create } from 'zustand'

type SessionUser = {
  userId: string
  nickname: string
  avatarUrl: string
}

type SessionState = {
  token: string | null
  user: SessionUser | null
  setSession: (session: { token: string; user: SessionUser }) => void
  clearSession: () => void
  hydrate: () => void
}

const storageKey = 'healing_party_session_v1'

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  user: null,
  setSession: (session) => {
    set({ token: session.token, user: session.user })
    localStorage.setItem(storageKey, JSON.stringify(session))
  },
  clearSession: () => {
    set({ token: null, user: null })
    localStorage.removeItem(storageKey)
  },
  hydrate: () => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as { token: string; user: SessionUser }
      if (parsed?.token && parsed?.user?.userId) set({ token: parsed.token, user: parsed.user })
    } catch {
      return
    }
  },
}))
