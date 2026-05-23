import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActivityLayout from './ActivityLayout'
import { apiFetch } from '@/api/client'
import { useSessionStore } from '@/stores/sessionStore'

const prompts = ['雨停之后，我决定…', '今天，我想对自己说…', '如果心情有颜色，那会是…']
const feelings = ['平静', '轻盈', '疲惫', '期待', '柔软', '有点难过', '被鼓励']

export default function StoryWeave() {
  const navigate = useNavigate()
  const token = useSessionStore((s) => s.token)
  const [prompt, setPrompt] = useState(prompts[0])
  const [feeling, setFeeling] = useState(feelings[0])
  const [line, setLine] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hint = useMemo(() => `提示词：「${prompt}」`, [prompt])

  async function settle() {
    if (!token || busy) return
    setBusy(true)
    setError(null)
    try {
      const data = await apiFetch<{ assetId: string; sharePath: string }>('/v1/posters/render', {
        method: 'POST',
        token,
        body: JSON.stringify({
          type: 'story',
          payload: { prompt, feeling, line, hint },
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
    <ActivityLayout title="共情故事卡（占位版）" subtitle="1.0.0 先跑通“提示词 → 感受词 → 一句话补全 → 生成故事海报（占位）”。">
      <div className="grid gap-4">
        <div>
          <div className="text-sm font-semibold text-zinc-900">提示词</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {prompts.map((p) => (
              <button
                key={p}
                className={[
                  'rounded-2xl border px-4 py-2 text-sm font-medium',
                  p === prompt ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-900/10 bg-white hover:bg-zinc-50',
                ].join(' ')}
                onClick={() => setPrompt(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-zinc-600">{hint}</div>
        </div>

        <div>
          <div className="text-sm font-semibold text-zinc-900">此刻感受词</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {feelings.map((f) => (
              <button
                key={f}
                className={[
                  'rounded-2xl border px-4 py-2 text-sm font-medium',
                  f === feeling ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-900/10 bg-white hover:bg-zinc-50',
                ].join(' ')}
                onClick={() => setFeeling(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-zinc-900">补全一句话</div>
          <textarea
            className="mt-2 min-h-[96px] w-full rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
            value={line}
            onChange={(e) => setLine(e.target.value)}
            placeholder="例如：雨停之后，我决定慢慢走回自己的节奏（占位）"
          />
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
        <button
          className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-emerald-200"
          disabled={!token || busy}
          onClick={settle}
        >
          结算：生成故事海报 — {feeling}
        </button>
      </div>
    </ActivityLayout>
  )
}
