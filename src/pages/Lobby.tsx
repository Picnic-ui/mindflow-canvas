import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '@/api/client'
import { useSessionStore } from '@/stores/sessionStore'

type MatchmakingResponse = {
  roomId: string
  theme: string
  expectedPlayers: number
  minStartPlayers: number
  joinedPlayers: number
}

type CreateRoomResponse = {
  roomId: string
  inviteCode: string
  roomState: unknown
}

const defaultThemes = ['春日植物派对', '雨天治愈派对', '夜晚放松派对']

export default function Lobby() {
  const navigate = useNavigate()
  const location = useLocation()
  const hydrate = useSessionStore((s) => s.hydrate)
  const token = useSessionStore((s) => s.token)
  const user = useSessionStore((s) => s.user)

  const lobbyState = location.state as { preferredTheme?: unknown } | null
  const preferredTheme = typeof lobbyState?.preferredTheme === 'string' ? lobbyState.preferredTheme : undefined
  const [theme, setTheme] = useState<string>(preferredTheme ?? defaultThemes[0])
  const [inviteCode, setInviteCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!token) navigate('/onboarding', { replace: true })
  }, [navigate, token])

  const canAct = useMemo(() => Boolean(token) && !busy, [busy, token])

  async function startMatchmaking() {
    if (!token) return
    setBusy(true)
    setError(null)
    try {
      const data = await apiFetch<MatchmakingResponse>('/v1/matchmaking/enqueue', {
        method: 'POST',
        token,
        body: JSON.stringify({
          theme,
          expectedPlayers: 8,
          minStartPlayers: 4,
        }),
      })
      navigate(`/room/${data.roomId}`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function createRoom() {
    if (!token) return
    setBusy(true)
    setError(null)
    try {
      const data = await apiFetch<CreateRoomResponse>('/v1/rooms', {
        method: 'POST',
        token,
        body: JSON.stringify({ theme, maxPlayers: 8 }),
      })
      navigate(`/room/${data.roomId}`, { state: { inviteCode: data.inviteCode } })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function joinByInvite() {
    if (!token) return
    const code = inviteCode.trim()
    if (!code) return
    setBusy(true)
    setError(null)
    try {
      const data = await apiFetch<{ roomId: string }>('/v1/matchmaking/enqueue', {
        method: 'POST',
        token,
        body: JSON.stringify({ theme: '邀请加入', expectedPlayers: 8, minStartPlayers: 4 }),
      })
      navigate(`/room/${data.roomId}`, { state: { inviteCode: code } })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-white via-emerald-50 to-amber-50">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-col gap-2">
          <div className="text-xs tracking-[0.28em] text-emerald-700/70">LOBBY</div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-2xl font-semibold text-zinc-900">大厅</div>
            <button
              className="rounded-xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              onClick={() => navigate('/')}
            >
              返回入口
            </button>
          </div>
          {user && (
            <div className="text-sm text-zinc-700">
              当前身份：{user.avatarUrl} {user.nickname}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
            <div className="text-sm font-semibold text-zinc-900">选择主题</div>
            <div className="mt-3 grid gap-2">
              {defaultThemes.map((t) => (
                <button
                  key={t}
                  className={[
                    'rounded-2xl border px-4 py-3 text-left text-sm transition',
                    t === theme ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-900/10 bg-white hover:bg-zinc-50',
                  ].join(' ')}
                  onClick={() => setTheme(t)}
                >
                  <div className="font-medium text-zinc-900">{t}</div>
                  <div className="mt-1 text-xs text-zinc-600">默认 8 人 · 允许缺人开局（≥4人可开）</div>
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                className="flex-1 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
                disabled={!canAct}
                onClick={startMatchmaking}
              >
                随机匹配
              </button>
              <button
                className="flex-1 rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
                disabled={!canAct}
                onClick={createRoom}
              >
                创建房间
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
            <div className="text-sm font-semibold text-zinc-900">邀请加入</div>
            <div className="mt-2 text-xs leading-5 text-zinc-600">
              1.0.0 先提供“邀请码占位流程”。后续会改成真正的 inviteCode → roomId 映射与链接加入。
            </div>
            <div className="mt-4 flex gap-2">
              <input
                className="flex-1 rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
                placeholder="输入邀请码（占位）"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <button
                className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
                disabled={!canAct || inviteCode.trim().length === 0}
                onClick={joinByInvite}
              >
                加入
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-900/10 bg-emerald-50/60 p-4">
              <div className="text-sm font-semibold text-zinc-900">安静角落</div>
              <div className="mt-1 text-xs text-zinc-700">在派对之外，沉淀作品、照料小盆栽、回看自然卡。</div>
              <button
                className="mt-3 rounded-xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                onClick={() => navigate('/me/garden')}
              >
                进入安静角落
              </button>
            </div>
          </div>
        </div>

        {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      </div>
    </div>
  )
}
