import { useMemo, useState } from 'react'
import ActivityLayout from './ActivityLayout'

const tags = ['压力', '疲惫', '迷茫', '孤独', '焦虑', '需要鼓励']

export default function KindMail() {
  const [tag, setTag] = useState(tags[0])
  const [request, setRequest] = useState('')
  const [reply, setReply] = useState('')

  const tip = useMemo(() => {
    const map: Record<string, string> = {
      压力: '你可以写：“最近我有点喘不过气，想听一句支持。”',
      疲惫: '你可以写：“我很累，但我还在坚持。想被看见。”',
      迷茫: '你可以写：“我有点不知道该往哪走，想听一句温柔的提醒。”',
      孤独: '你可以写：“我有点孤单，想知道有人在。”',
      焦虑: '你可以写：“我总在担心未来，想听一句安定。”',
      需要鼓励: '你可以写：“请给我一句肯定，我想继续向前。”',
    }
    return map[tag]
  }, [tag])

  return (
    <ActivityLayout title="善意信箱（占位版）" subtitle="1.0.0 先跑通“短句请求/短句回应”的输入与结算；后续接入匿名分配、敏感词、举报与展示流程。">
      <div className="grid gap-4">
        <div>
          <div className="text-sm font-semibold text-zinc-900">情绪标签</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t}
                className={[
                  'rounded-2xl border px-4 py-2 text-sm font-medium',
                  t === tag ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-900/10 bg-white hover:bg-zinc-50',
                ].join(' ')}
                onClick={() => setTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-zinc-600">{tip}</div>
        </div>

        <div>
          <div className="text-sm font-semibold text-zinc-900">我的请求（短句）</div>
          <textarea
            className="mt-2 min-h-[96px] w-full rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="最多 60 字（占位）"
          />
        </div>

        <div>
          <div className="text-sm font-semibold text-zinc-900">我给他人的回应（短句）</div>
          <textarea
            className="mt-2 min-h-[96px] w-full rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="最多 60 字（占位）"
          />
        </div>

        <button className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
          结算：投入信箱并收集贴纸（占位）
        </button>
      </div>
    </ActivityLayout>
  )
}

