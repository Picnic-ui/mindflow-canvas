import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type RoomState = {
  memberIds: string[]
}

type RemoteAudio = { userId: string; stream: MediaStream }

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

export function useWebRtcVoice(params: {
  ws: WebSocket | null
  selfUserId: string | null
  roomState: RoomState | null
}) {
  const { ws, selfUserId, roomState } = params
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remoteAudios, setRemoteAudios] = useState<RemoteAudio[]>([])

  const localStreamRef = useRef<MediaStream | null>(null)
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map())

  const peers = useMemo(() => {
    if (!roomState || !selfUserId) return []
    return roomState.memberIds.filter((id) => id !== selfUserId)
  }, [roomState, selfUserId])

  const send = useCallback(
    (message: unknown) => {
      if (!ws || ws.readyState !== ws.OPEN) return
      ws.send(JSON.stringify(message))
    },
    [ws],
  )

  const syncRemoteAudios = useCallback(() => {
    const next: RemoteAudio[] = []
    for (const [userId, stream] of remoteStreamsRef.current.entries()) {
      next.push({ userId, stream })
    }
    setRemoteAudios(next)
  }, [])

  const createPc = useCallback(
    (targetUserId: string) => {
      const existing = pcsRef.current.get(targetUserId)
      if (existing) return existing

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })

      const local = localStreamRef.current
      if (local) {
        for (const track of local.getTracks()) pc.addTrack(track, local)
      }

      pc.onicecandidate = (ev) => {
        if (!ev.candidate || !selfUserId) return
        send({
          type: 'webrtc.ice',
          payload: { targetUserId, candidate: ev.candidate.toJSON() },
        })
      }

      pc.ontrack = (ev) => {
        const stream = remoteStreamsRef.current.get(targetUserId) ?? new MediaStream()
        for (const track of ev.streams?.[0]?.getTracks?.() ?? [ev.track]) {
          if (!stream.getTracks().some((t) => t.id === track.id)) stream.addTrack(track)
        }
        remoteStreamsRef.current.set(targetUserId, stream)
        syncRemoteAudios()
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          pcsRef.current.delete(targetUserId)
        }
      }

      pcsRef.current.set(targetUserId, pc)
      return pc
    },
    [send, selfUserId, syncRemoteAudios],
  )

  const connect = useCallback(async () => {
    if (!selfUserId) return
    if (!ws || ws.readyState !== ws.OPEN) {
      setError('WS 未连接')
      setStatus('error')
      return
    }

    setError(null)
    setStatus('connecting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      stream.getAudioTracks().forEach((t) => (t.enabled = !muted))

      for (const peerId of peers) {
        const pc = createPc(peerId)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        send({ type: 'webrtc.offer', payload: { targetUserId: peerId, sdp: pc.localDescription } })
      }

      setStatus('connected')
    } catch (e) {
      setError((e as Error).message)
      setStatus('error')
    }
  }, [createPc, muted, peers, selfUserId, send, ws])

  const disconnect = useCallback(() => {
    for (const pc of pcsRef.current.values()) pc.close()
    pcsRef.current.clear()
    remoteStreamsRef.current.clear()
    syncRemoteAudios()
    const local = localStreamRef.current
    if (local) local.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setStatus('idle')
    setError(null)
  }, [syncRemoteAudios])

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev
      const local = localStreamRef.current
      if (local) local.getAudioTracks().forEach((t) => (t.enabled = !next))
      return next
    })
  }, [])

  const handleSignal = useCallback(
    async (event: { type: string; payload: unknown }) => {
      if (!selfUserId) return
      if (event.type !== 'webrtc.offer' && event.type !== 'webrtc.answer' && event.type !== 'webrtc.ice') return
      if (!isRecord(event.payload)) return

      const fromUserId = typeof event.payload.fromUserId === 'string' ? event.payload.fromUserId : ''
      const targetUserId = typeof event.payload.targetUserId === 'string' ? event.payload.targetUserId : ''
      if (!fromUserId || !targetUserId) return
      if (targetUserId !== selfUserId) return

      const pc = createPc(fromUserId)

      if (event.type === 'webrtc.offer') {
        const sdp = event.payload.sdp as RTCSessionDescriptionInit
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        send({ type: 'webrtc.answer', payload: { targetUserId: fromUserId, sdp: pc.localDescription } })
      } else if (event.type === 'webrtc.answer') {
        if (!pc.currentRemoteDescription) {
          const sdp = event.payload.sdp as RTCSessionDescriptionInit
          await pc.setRemoteDescription(new RTCSessionDescription(sdp))
        }
      } else if (event.type === 'webrtc.ice') {
        const candidate = event.payload.candidate as RTCIceCandidateInit
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
    },
    [createPc, selfUserId, send],
  )

  useEffect(() => {
    if (status !== 'connected') return
    if (!selfUserId) return
    if (!ws || ws.readyState !== ws.OPEN) return

    const known = new Set(pcsRef.current.keys())
    const newcomers = peers.filter((id) => !known.has(id))
    if (newcomers.length === 0) return

    ;(async () => {
      for (const peerId of newcomers) {
        const pc = createPc(peerId)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        send({ type: 'webrtc.offer', payload: { targetUserId: peerId, sdp: pc.localDescription } })
      }
    })()
  }, [createPc, peers, selfUserId, send, status, ws])

  return {
    status,
    muted,
    error,
    remoteAudios,
    connect,
    disconnect,
    toggleMute,
    handleSignal,
  }
}
