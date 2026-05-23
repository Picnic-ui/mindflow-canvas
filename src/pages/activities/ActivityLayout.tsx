import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function ActivityLayout(props: {
  title: string
  subtitle: string
  children?: ReactNode
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { roomId?: unknown } | null
  const roomId = typeof state?.roomId === 'string' ? state.roomId : undefined

  return (
    <div className="min-h-dvh bg-gradient-to-b from-white via-emerald-50 to-amber-50">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="rounded-3xl border border-zinc-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
          <div className="text-xs tracking-[0.28em] text-emerald-700/70">ACTIVITY</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">{props.title}</div>
          <div className="mt-2 text-sm leading-6 text-zinc-700">{props.subtitle}</div>

          {props.children && <div className="mt-6">{props.children}</div>}

          <div className="mt-6 flex gap-3">
            <button
              className="flex-1 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              onClick={() => navigate(roomId ? `/room/${roomId}` : '/lobby')}
            >
              返回房间
            </button>
            <button
              className="flex-1 rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              onClick={() => navigate('/me/garden')}
            >
              去安静角落
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
