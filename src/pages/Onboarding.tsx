import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '@/api/client'
import { useSessionStore } from '@/stores/sessionStore'

type GuestSessionResponse = {
  userId: string
  token: string
  nickname: string
  avatarUrl: string
}

const avatars = ['🌿', '🎨', '☁️', '🌙', '🫧', '🍃', '🕊️', '🌼']

export default function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const hydrate = useSessionStore((s) => s.hydrate)
  const setSession = useSessionStore((s) => s.setSession)
  const token = useSessionStore((s) => s.token)

  const onboardingState = location.state as { preferredTheme?: unknown } | null
  const preferredTheme = typeof onboardingState?.preferredTheme === 'string' ? onboardingState.preferredTheme : undefined

  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(avatars[0])
  const [agreed, setAgreed] = useState(false)
  const [micStatus, setMicStatus] = useState<'unknown' | 'ok' | 'denied'>('unknown')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (token) navigate('/lobby', { replace: true })
  }, [navigate, token])

  const canSubmit = useMemo(() => agreed && !submitting, [agreed, submitting])

  async function checkMic() {
    setError(null)
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicStatus('ok')
    } catch {
      setMicStatus('denied')
    }
  }

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const data = await apiFetch<GuestSessionResponse>('/v1/guest/session', {
        method: 'POST',
        body: JSON.stringify({ nickname, avatarUrl }),
      })
      setSession({
        token: data.token,
        user: { userId: data.userId, nickname: data.nickname, avatarUrl: data.avatarUrl },
      })
      navigate('/lobby', { replace: true, state: { preferredTheme } })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      <div className="mx-auto max-w-xl px-5 py-10">
        <div className="rounded-3xl border border-zinc-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
          <div className="text-xs tracking-[0.28em] text-emerald-700/70">ONBOARDING</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">进入房间之前</div>
          <div className="mt-2 text-sm leading-6 text-zinc-700">
            这是减压与情绪舒缓的轻社交空间，不提供医疗诊断或治疗建议。请保持友善与尊重。
          </div>

          <div className="mt-6 grid gap-3">
            <div className="text-sm font-medium text-zinc-900">昵称</div>
            <input
              className="w-full rounded-xl border border-zinc-900/10 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="给自己起个温柔的名字（可不填）"
            />
          </div>

          <div className="mt-5">
            <div className="text-sm font-medium text-zinc-900">头像</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {avatars.map((a) => (
                <button
                  key={a}
                  className={[
                    'h-10 w-10 rounded-xl border text-lg',
                    a === avatarUrl ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-900/10 bg-white hover:bg-zinc-50',
                  ].join(' ')}
                  onClick={() => setAvatarUrl(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-900/10 bg-emerald-50/60 p-4">
            <div className="text-sm font-medium text-zinc-900">麦克风权限</div>
            <div className="mt-1 text-xs leading-5 text-zinc-700">
              房间内语音为必选功能。你可以先授权麦克风，后续也可在系统设置中关闭。
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                onClick={checkMic}
              >
                检测麦克风
              </button>
              <div className="text-xs text-zinc-700">
                {micStatus === 'unknown' && '未检测'}
                {micStatus === 'ok' && '已允许'}
                {micStatus === 'denied' && '被拒绝（仍可继续，但进房可能失败）'}
              </div>
            </div>
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-zinc-900/20"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              我已阅读并同意平台声明与使用守则；我理解这里提供的是减压与陪伴体验，并非医疗服务。
            </span>
          </label>

          {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

          <div className="mt-6 flex gap-3">
            <button
              className="flex-1 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={!canSubmit}
              onClick={submit}
            >
              进入大厅
            </button>
            <button
              className="rounded-2xl border border-zinc-900/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              onClick={() => navigate('/')}
            >
              返回
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
