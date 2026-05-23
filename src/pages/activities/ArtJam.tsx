import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActivityLayout from './ActivityLayout'
import { apiFetch } from '@/api/client'
import { useSessionStore } from '@/stores/sessionStore'

const palettes = [
  { name: '春芽', colors: ['#0f766e', '#22c55e', '#fde68a', '#fb7185'] },
  { name: '雾白', colors: ['#0f172a', '#64748b', '#e2e8f0', '#f59e0b'] },
  { name: '夜风', colors: ['#111827', '#334155', '#38bdf8', '#a78bfa'] },
]

export default function ArtJam() {
  const navigate = useNavigate()
  const token = useSessionStore((s) => s.token)
  const [prompt, setPrompt] = useState('画一张“今天的心情天气”')
  const [palette, setPalette] = useState(palettes[0].name)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = useMemo(() => palettes.find((p) => p.name === palette) ?? palettes[0], [palette])

  async function settle() {
    if (!token || busy) return
    setBusy(true)
    setError(null)
    try {
      const data = await apiFetch<{ assetId: string; sharePath: string }>('/v1/posters/render', {
        method: 'POST',
        token,
        body: JSON.stringify({
          type: 'art',
          payload: { prompt, palette, note },
        }),
      })
      navigate(data.sharePath)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ActivityLayout title="共创画廊（占位版）" subtitle="1.0.0 先把创作流程跑通：主题 → 输入 → 结算生成海报（后续接入多人画布/拼贴/上色）。">
      <div className="grid gap-4">
        <div>
          <div className="text-sm font-semibold text-zinc-900">主题提示</div>
          <input
            className="mt-2 w-full rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div>
          <div className="text-sm font-semibold text-zinc-900">配色</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {palettes.map((p) => (
              <button
                key={p.name}
                className={[
                  'rounded-2xl border px-4 py-2 text-sm font-medium',
                  p.name === palette ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-900/10 bg-white hover:bg-zinc-50',
                ].join(' ')}
                onClick={() => setPalette(p.name)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            {current.colors.map((c) => (
              <div key={c} className="h-8 w-8 rounded-xl border border-zinc-900/10" style={{ background: c }} />
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-zinc-900">一句话记录</div>
          <textarea
            className="mt-2 min-h-[96px] w-full rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="写下你此刻想放进画里的一个意象（占位）"
          />
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
        <button
          className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-emerald-200"
          disabled={!token || busy}
          onClick={settle}
        >
          结算：生成作品海报
        </button>
      </div>
    </ActivityLayout>
  )
}
