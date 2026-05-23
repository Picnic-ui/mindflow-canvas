import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'

export default function Settings() {
  const navigate = useNavigate()
  const hydrate = useSessionStore((s) => s.hydrate)
  const clearSession = useSessionStore((s) => s.clearSession)
  const user = useSessionStore((s) => s.user)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <div className="min-h-dvh bg-gradient-to-b from-white via-emerald-50 to-amber-50">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="rounded-3xl border border-zinc-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
          <div className="text-xs tracking-[0.28em] text-emerald-700/70">SETTINGS</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">设置与安全（占位版）</div>
          {user && (
            <div className="mt-2 text-sm text-zinc-700">
              当前身份：{user.avatarUrl} {user.nickname}
            </div>
          )}

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-zinc-900/10 bg-white p-5">
              <div className="text-sm font-semibold text-zinc-900">语音与权限</div>
              <div className="mt-2 text-xs leading-5 text-zinc-600">
                语音为必选能力。若你拒绝麦克风权限，进房将提示你在浏览器设置中开启。
              </div>
              <button
                className="mt-3 rounded-xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                onClick={() => navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {})}
              >
                重新申请麦克风权限
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-900/10 bg-white p-5">
              <div className="text-sm font-semibold text-zinc-900">风控与合规</div>
              <div className="mt-2 text-xs leading-5 text-zinc-600">
                1.0.0 会提供敏感词过滤、举报、拉黑、踢出/静音等最小集。若你处于紧急危险，请联系当地紧急热线。
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-900/10 bg-white p-5">
              <div className="text-sm font-semibold text-zinc-900">账号</div>
              <div className="mt-2 text-xs text-zinc-600">1.0.0 默认游客模式。</div>
              <button
                className="mt-3 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                onClick={() => {
                  clearSession()
                  navigate('/onboarding')
                }}
              >
                退出并重置身份
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              className="rounded-xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              onClick={() => navigate('/')}
            >
              返回入口
            </button>
            <button
              className="rounded-xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              onClick={() => navigate('/lobby')}
            >
              去大厅
            </button>
            <button
              className="rounded-xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              onClick={() => navigate('/me/garden')}
            >
              安静角落
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

