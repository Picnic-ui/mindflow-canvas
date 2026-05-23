import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'

export default function Garden() {
  const navigate = useNavigate()
  const hydrate = useSessionStore((s) => s.hydrate)
  const user = useSessionStore((s) => s.user)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <div className="min-h-dvh bg-gradient-to-b from-zinc-950 via-zinc-900 to-emerald-950">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur">
          <div className="text-xs tracking-[0.28em] text-emerald-200/70">ZEN-GARDEN</div>
          <div className="mt-2 text-2xl font-semibold text-white">安静角落（占位版）</div>
          <div className="mt-2 text-sm leading-6 text-emerald-50/80">
            1.0.0 先把“作品沉淀入口”与“轻交互”跑通：盆栽、生长阶段、作品墙、环境声开关。
          </div>

          {user && (
            <div className="mt-4 text-sm text-emerald-50/80">
              当前身份：{user.avatarUrl} {user.nickname}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-white">我的小盆栽</div>
              <div className="mt-2 text-xs text-emerald-50/70">阶段：幼苗（占位）</div>
              <div className="mt-4 flex gap-2">
                <button className="rounded-xl bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-300">
                  浇水（占位）
                </button>
                <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                  摆放装饰（占位）
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-white">作品墙</div>
              <div className="mt-2 text-xs text-emerald-50/70">这里将展示海报与自然卡（占位）。</div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl border border-white/10 bg-white/5" />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              onClick={() => navigate('/')}
            >
              返回入口
            </button>
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              onClick={() => navigate('/lobby')}
            >
              去大厅
            </button>
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              onClick={() => navigate('/settings')}
            >
              设置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

