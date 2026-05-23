import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '@/api/client'

type AssetResponse = {
  id: string
  type: 'art' | 'story' | 'nature'
  createdAt: number
  payload: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

export default function Share() {
  const navigate = useNavigate()
  const { assetId } = useParams()
  const [asset, setAsset] = useState<AssetResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) return
    apiFetch<AssetResponse>(`/v1/assets/${assetId}`)
      .then((data) => setAsset(data))
      .catch((e) => setError((e as Error).message))
  }, [assetId])

  const title =
    asset?.type === 'art' ? '作品海报' : asset?.type === 'story' ? '故事海报' : asset?.type === 'nature' ? '自然卡片' : '分享'

  const payloadText = (() => {
    if (!asset) return ''
    if (!isRecord(asset.payload)) return JSON.stringify(asset.payload)
    const hint = typeof asset.payload.hint === 'string' ? asset.payload.hint : ''
    const note = typeof asset.payload.note === 'string' ? asset.payload.note : ''
    const prompt = typeof asset.payload.prompt === 'string' ? asset.payload.prompt : ''
    return [prompt, hint, note].filter(Boolean).join(' · ') || JSON.stringify(asset.payload)
  })()

  return (
    <div className="min-h-dvh bg-gradient-to-b from-white via-amber-50 to-emerald-50">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="rounded-3xl border border-zinc-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
          <div className="text-xs tracking-[0.28em] text-emerald-700/70">SHARE</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">{title}</div>
          {assetId && <div className="mt-1 text-xs text-zinc-600">ID：{assetId}</div>}

          {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          {asset && (
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-zinc-900/10 bg-zinc-50 p-5">
                <div className="text-sm font-semibold text-zinc-900">内容摘要</div>
                <div className="mt-2 text-sm leading-6 text-zinc-700">{payloadText}</div>
              </div>
              <div className="aspect-[3/4] rounded-2xl border border-zinc-900/10 bg-white" />
              <div className="text-xs text-zinc-600">1.0.0 暂用占位图。后续接入海报图片合成与水印。</div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              onClick={() => navigate('/')}
            >
              去入口
            </button>
            <button
              className="rounded-xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              onClick={() => navigate('/lobby')}
            >
              去大厅
            </button>
            <button
              className="rounded-xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
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

