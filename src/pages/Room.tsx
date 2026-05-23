import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '@/api/client'
import { useSessionStore } from '@/stores/sessionStore'
import VoicePanel from '@/components/VoicePanel'
import { useWebRtcVoice } from '@/hooks/useWebRtcVoice'

type RoomState = {
  id: string
  theme: string
  status: string
  maxPlayers: number
  memberIds: string[]
}

type WsEvent = { type: string; payload: unknown }

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isRoomState(value: unknown): value is RoomState {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string') return false
  if (typeof value.theme !== 'string') return false
  if (typeof value.status !== 'string') return false
  if (typeof value.maxPlayers !== 'number') return false
  if (!Array.isArray(value.memberIds)) return false
  if (!value.memberIds.every((m) => typeof m === 'string')) return false
  return true
}

export default function Room() {
  const navigate = useNavigate()
  const location = useLocation()
  const { roomId } = useParams()
  const hydrate = useSessionStore((s) => s.hydrate)
  const token = useSessionStore((s) => s.token)
  const user = useSessionStore((s) => s.user)

  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [chatText, setChatText] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ fromUserId: string; text: string }>>([])
  const [chatNotice, setChatNotice] = useState<string | null>(null)

  const state = location.state as { inviteCode?: unknown } | null
  const inviteCode = typeof state?.inviteCode === 'string' ? state.inviteCode : undefined
  const wsRef = useRef<WebSocket | null>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)

  const voice = useWebRtcVoice({
    ws,
    selfUserId: user?.userId ?? null,
    roomState,
  })
  const voiceHandlerRef = useRef(voice.handleSignal)

  useEffect(() => {
    voiceHandlerRef.current = voice.handleSignal
  }, [voice.handleSignal])

  useEffect(() => {
    return () => voice.disconnect()
  }, [voice])

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!token) navigate('/onboarding', { replace: true })
  }, [navigate, token])

  useEffect(() => {
    if (!token || !roomId) return
    setError(null)
    apiFetch<{ roomState: RoomState }>(`/v1/rooms/${roomId}/join`, {
      method: 'POST',
      token,
      body: JSON.stringify(inviteCode ? { inviteCode } : {}),
    })
      .then((data) => setRoomState(data.roomState))
      .catch((e) => setError((e as Error).message))
  }, [inviteCode, roomId, token])

  useEffect(() => {
    if (!token || !roomId) return
    if (wsRef.current) return
    setWsStatus('connecting')

    const wsUrl = `ws://localhost:3001/ws?token=${encodeURIComponent(token)}&roomId=${encodeURIComponent(roomId)}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    setWs(ws)

    ws.onopen = () => setWsStatus('connected')
    ws.onclose = () => setWsStatus('disconnected')
    ws.onerror = () => setWsStatus('disconnected')
    ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data as string) as WsEvent
        if (event.type === 'room.state' && isRoomState(event.payload)) setRoomState(event.payload)
        if (event.type === 'chat.message' && isRecord(event.payload)) {
          const text = typeof event.payload.text === 'string' ? event.payload.text : ''
          const fromUserId = typeof event.payload.fromUserId === 'string' ? event.payload.fromUserId : ''
          if (text && fromUserId) setChatMessages((prev) => [...prev.slice(-49), { fromUserId, text }])
        }
        if (event.type === 'mod.notice' && isRecord(event.payload)) {
          const reason = typeof event.payload.reason === 'string' ? event.payload.reason : '操作被拦截'
          setChatNotice(reason)
          window.setTimeout(() => setChatNotice(null), 2500)
        }
        voiceHandlerRef.current(event)
      } catch {
        return
      }
    }

    return () => {
      wsRef.current = null
      setWs(null)
      ws.close()
    }
  }, [roomId, token])

  const membersCount = roomState?.memberIds.length ?? 0
  const canStart = membersCount >= 4

  function sendChat() {
    if (!ws || ws.readyState !== ws.OPEN) return
    const text = chatText.trim()
    if (!text) return
    ws.send(JSON.stringify({ type: 'chat.message', payload: { text } }))
    setChatText('')
  }

  const actions = useMemo(
    () => [
      { id: 'kind-mail', name: '善意信箱（暖场）', path: '/activity/kind-mail' },
      { id: 'art-jam', name: '共创画廊（创作）', path: '/activity/art-jam' },
      { id: 'story-weave', name: '共情故事卡（创作/收尾）', path: '/activity/story-weave' },
      { id: 'nature-quest', name: '自然审美任务（探索）', path: '/activity/nature-quest' },
      { id: 'music', name: '音乐疗愈（沉浸）', path: '/activity/music' },
      { id: 'pixel-rail-defense', name: '像素轨道炮塔（对抗）', path: '/activity/pixel-rail-defense' },
    ],
    [],
  )

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex flex-col gap-2">
          <div className="text-xs tracking-[0.28em] text-emerald-700/70">ROOM</div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-2xl font-semibold text-zinc-900">{roomState?.theme ?? '房间'}</div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                onClick={() => navigate('/lobby')}
              >
                返回大厅
              </button>
              <button
                className="rounded-xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                onClick={() => navigate('/me/garden')}
              >
                安静角落
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-700">
            {user && (
              <span>
                我：{user.avatarUrl} {user.nickname}
              </span>
            )}
            <span>
              在线：{membersCount}/{roomState?.maxPlayers ?? 8}
            </span>
            <span>WS：{wsStatus}</span>
            <span className="text-xs text-zinc-500">缺人开局阈值：4 人</span>
          </div>
          {inviteCode && <div className="text-xs text-zinc-600">邀请码：{inviteCode}</div>}
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <VoicePanel voice={voice} />

          <div className="rounded-3xl border border-zinc-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
            <div className="text-sm font-semibold text-zinc-900">本局 3 个活动（手动选择占位）</div>
            <div className="mt-2 text-xs text-zinc-600">先跑通全链路：进入活动 → 返回房间 → 进入结算。</div>
            <div className="mt-4 grid gap-2">
              {actions.map((a) => (
                <button
                  key={a.id}
                  className="rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-left text-sm hover:bg-zinc-50"
                  onClick={() => navigate(a.path, { state: { roomId } })}
                >
                  {a.name}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                className="flex-1 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:bg-emerald-200"
                disabled={!canStart}
                onClick={() => navigate(`/result/${roomId}`)}
              >
                结束并结算
              </button>
              <button
                className="flex-1 rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                onClick={() => navigate('/settings')}
              >
                安全与设置
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
          <div className="text-sm font-semibold text-zinc-900">房间聊天（占位）</div>
          <div className="mt-2 text-xs text-zinc-600">1.0.0 已接入 WS 广播 + 最小敏感词过滤（禁外链/联系方式）。</div>
          {chatNotice && <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{chatNotice}</div>}
          <div className="mt-4 max-h-48 overflow-auto rounded-2xl border border-zinc-900/10 bg-white p-4">
            {chatMessages.length === 0 && <div className="text-xs text-zinc-500">还没有消息</div>}
            <div className="grid gap-2">
              {chatMessages.map((m, i) => (
                <div key={`${m.fromUserId}-${i}`} className="text-sm text-zinc-800">
                  <span className="mr-2 text-xs text-zinc-500">{m.fromUserId.slice(0, 6)}</span>
                  {m.text}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
              placeholder="说一句温柔的话"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendChat()
              }}
            />
            <button
              className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              onClick={sendChat}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
