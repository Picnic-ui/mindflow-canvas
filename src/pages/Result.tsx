import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function Result() {
  const navigate = useNavigate()
  const { sessionId } = useParams()

  const cards = useMemo(
    () => [
      { title: '作品海报', desc: '来自共创画廊 / 共情故事卡（占位）' },
      { title: '自然卡片', desc: '来自自然审美任务（占位）' },
      { title: '善意贴纸', desc: '来自善意信箱（占位）' },
    ],
    [],
  )

  return (
    <div className="min-h-dvh bg-gradient-to-b from-white via-amber-50 to-emerald-50">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="rounded-3xl border border-zinc-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
          <div className="text-xs tracking-[0.28em] text-emerald-700/70">RESULT</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">本局结算（占位版）</div>
          <div className="mt-2 text-sm text-zinc-700">Session：{sessionId}</div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {cards.map((c) => (
              <div key={c.title} className="rounded-2xl border border-zinc-900/10 bg-white p-5">
                <div className="text-sm font-semibold text-zinc-900">{c.title}</div>
                <div className="mt-2 text-xs text-zinc-600">{c.desc}</div>
                <div className="mt-4 aspect-[3/4] rounded-xl border border-zinc-900/10 bg-zinc-50" />
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <button
              className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              onClick={() => navigate('/lobby')}
            >
              再来一局
            </button>
            <button
              className="rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              onClick={() => navigate('/me/garden')}
            >
              存入安静角落
            </button>
            <button
              className="rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              onClick={() => navigate('/')}
            >
              返回入口
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

