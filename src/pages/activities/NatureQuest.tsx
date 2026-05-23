import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActivityLayout from './ActivityLayout'
import { apiFetch } from '@/api/client'
import { useSessionStore } from '@/stores/sessionStore'

const tasks = [
  { id: 'color', name: '色卡任务：找一抹治愈的绿色' },
  { id: 'texture', name: '纹理任务：拍一张叶脉/树皮/花瓣纹理' },
  { id: 'identify', name: '识别任务：拍摄植物并识别（占位）' },
]

export default function NatureQuest() {
  const navigate = useNavigate()
  const token = useSessionStore((s) => s.token)
  const [taskId, setTaskId] = useState(tasks[0].id)
  const [note, setNote] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const taskLabel = useMemo(() => tasks.find((t) => t.id === taskId)?.name ?? tasks[0].name, [taskId])

  async function settle() {
    if (!token || busy) return
    setBusy(true)
    setError(null)
    try {
      const data = await apiFetch<{ assetId: string; sharePath: string }>('/v1/posters/render', {
        method: 'POST',
        token,
        body: JSON.stringify({
          type: 'nature',
          payload: { taskId, taskLabel, note, fileName },
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
    <ActivityLayout title="自然审美任务（占位版）" subtitle="1.0.0 先跑通“拍照上传 → 生成自然卡片（占位）→ 结算”。后续接入 Pl@ntNet 识别与色板/纹理提取。">
      <div className="grid gap-4">
        <div>
          <div className="text-sm font-semibold text-zinc-900">选择任务</div>
          <div className="mt-2 grid gap-2">
            {tasks.map((t) => (
              <button
                key={t.id}
                className={[
                  'rounded-2xl border px-4 py-3 text-left text-sm',
                  t.id === taskId ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-900/10 bg-white hover:bg-zinc-50',
                ].join(' ')}
                onClick={() => setTaskId(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/60 p-4 text-xs leading-5 text-zinc-700">
          拍摄提示：保持光线充足、对焦清晰、尽量让主体占画面 1/3 以上；不要去危险地点完成任务。
        </div>

        <div>
          <div className="text-sm font-semibold text-zinc-900">上传照片（占位）</div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="mt-2 block w-full text-sm text-zinc-700 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-800"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          {fileName && <div className="mt-2 text-xs text-zinc-600">已选择：{fileName}</div>}
        </div>

        <div>
          <div className="text-sm font-semibold text-zinc-900">一句话观察</div>
          <textarea
            className="mt-2 min-h-[96px] w-full rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：这片叶脉像一张细密的地图（占位）"
          />
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
        <button
          className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-emerald-200"
          disabled={!token || busy}
          onClick={settle}
        >
          结算：生成自然卡片 — {taskLabel}
        </button>
      </div>
    </ActivityLayout>
  )
}
