import { useMemo, useState } from 'react'
import ActivityLayout from './ActivityLayout'

const tracks = [
  { id: 'lofi', name: 'Lo-fi 轻拍（占位）' },
  { id: 'piano', name: '钢琴与雨声（占位）' },
  { id: 'forest', name: '森林白噪音（占位）' },
]

export default function Music() {
  const [trackId, setTrackId] = useState(tracks[0].id)
  const [intensity, setIntensity] = useState(50)
  const [note, setNote] = useState('')

  const trackName = useMemo(() => tracks.find((t) => t.id === trackId)?.name ?? tracks[0].name, [trackId])

  return (
    <ActivityLayout title="音乐疗愈（占位版）" subtitle="1.0.0 先跑通“选择曲目 → 呼吸节奏强度 → 心情记录 → 结算”。后续接入真正音频与呼吸节奏动效。">
      <div className="grid gap-4">
        <div>
          <div className="text-sm font-semibold text-zinc-900">选择曲目</div>
          <div className="mt-2 grid gap-2">
            {tracks.map((t) => (
              <button
                key={t.id}
                className={[
                  'rounded-2xl border px-4 py-3 text-left text-sm',
                  t.id === trackId ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-900/10 bg-white hover:bg-zinc-50',
                ].join(' ')}
                onClick={() => setTrackId(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-zinc-900">呼吸节奏强度</div>
            <div className="text-xs text-zinc-600">{intensity}</div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="mt-3 w-full accent-emerald-700"
          />
          <div className="mt-2 text-xs text-zinc-600">建议戴耳机。强度越高，节奏提示越明显（占位）。</div>
        </div>

        <div>
          <div className="text-sm font-semibold text-zinc-900">此刻感受</div>
          <textarea
            className="mt-2 min-h-[96px] w-full rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：我开始能听见自己的呼吸了（占位）"
          />
        </div>

        <button className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
          结算：心情打分与分享（占位）— {trackName}
        </button>
      </div>
    </ActivityLayout>
  )
}

