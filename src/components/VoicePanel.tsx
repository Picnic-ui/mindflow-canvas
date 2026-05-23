export default function VoicePanel(props: {
  voice: {
    status: 'idle' | 'connecting' | 'connected' | 'error'
    muted: boolean
    error: string | null
    remoteAudios: { userId: string; stream: MediaStream }[]
    connect: () => void
    disconnect: () => void
    toggleMute: () => void
  }
}) {
  const voice = props.voice

  return (
    <div className="rounded-3xl border border-zinc-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
      <div className="text-sm font-semibold text-zinc-900">语音（WebRTC Mesh 本地方案）</div>
      <div className="mt-2 text-xs leading-5 text-zinc-600">
        当前环境缺少 LiveKit Cloud 账号与本地 LiveKit Server 依赖，因此 1.0.0 先用 WebSocket 信令 + WebRTC Mesh
        跑通 8 人语音闭环，后续可无缝替换为 LiveKit。
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
        <span>状态：{voice.status}</span>
        <span>静音：{voice.muted ? '是' : '否'}</span>
        <span>远端：{voice.remoteAudios.length}</span>
      </div>

      {voice.error && <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{voice.error}</div>}

      <div className="mt-4 flex flex-wrap gap-2">
        {voice.status === 'idle' && (
          <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800" onClick={voice.connect}>
            连接语音
          </button>
        )}
        {voice.status !== 'idle' && (
          <button
            className="rounded-xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            onClick={voice.disconnect}
          >
            断开
          </button>
        )}
        <button
          className="rounded-xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:text-zinc-400"
          disabled={voice.status === 'idle'}
          onClick={voice.toggleMute}
        >
          {voice.muted ? '取消静音' : '静音'}
        </button>
      </div>

      <div className="hidden">
        {voice.remoteAudios.map((a) => (
          <audio key={a.userId} autoPlay playsInline ref={(el) => el && (el.srcObject = a.stream)} />
        ))}
      </div>
    </div>
  )
}
