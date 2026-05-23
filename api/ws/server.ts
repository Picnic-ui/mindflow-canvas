import type http from 'http'
import { WebSocketServer, type WebSocket } from 'ws'
import { getRoomById, getUserIdByToken, removeFromRoom } from '../core/store.js'
import { moderateText } from '../core/moderation.js'

type RoomEvent = {
  type: string
  payload: unknown
}

const roomClients = new Map<string, Set<WebSocket>>()
const roomClientsByUser = new Map<string, Map<string, Set<WebSocket>>>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

export function broadcastRoomEvent(roomId: string, event: RoomEvent): void {
  const clients = roomClients.get(roomId)
  if (!clients || clients.size === 0) return
  const message = JSON.stringify(event)
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(message)
  }
}

function sendToUser(roomId: string, userId: string, event: RoomEvent): void {
  const map = roomClientsByUser.get(roomId)
  const set = map?.get(userId)
  if (!set || set.size === 0) return
  const message = JSON.stringify(event)
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) ws.send(message)
  }
}

export function attachWebSocketServer(server: http.Server): void {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url ?? '', 'http://localhost')
    const token = url.searchParams.get('token') ?? ''
    const roomId = url.searchParams.get('roomId') ?? ''

    const userId = getUserIdByToken(token)
    const room = roomId ? getRoomById(roomId) : undefined
    const allowed = Boolean(userId && room && room.memberIds.has(userId))

    if (!allowed) {
      ws.close(1008, 'unauthorized')
      return
    }

    const set = roomClients.get(roomId) ?? new Set<WebSocket>()
    set.add(ws)
    roomClients.set(roomId, set)

    const userMap = roomClientsByUser.get(roomId) ?? new Map<string, Set<WebSocket>>()
    const userSet = userMap.get(userId!) ?? new Set<WebSocket>()
    userSet.add(ws)
    userMap.set(userId!, userSet)
    roomClientsByUser.set(roomId, userMap)

    ws.send(
      JSON.stringify({
        type: 'room.state',
        payload: {
          id: room!.id,
          theme: room!.theme,
          status: room!.status,
          maxPlayers: room!.maxPlayers,
          memberIds: Array.from(room!.memberIds),
        },
      }),
    )

    broadcastRoomEvent(roomId, { type: 'room.join', payload: { userId } })

    ws.on('message', (data) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(String(data)) as unknown
      } catch {
        return
      }
      if (!isRecord(parsed)) return
      const type = typeof parsed.type === 'string' ? parsed.type : ''
      const payload = parsed.payload
      if (!type) return

      if (type === 'webrtc.offer' || type === 'webrtc.answer' || type === 'webrtc.ice') {
        if (!isRecord(payload)) return
        const targetUserId = typeof payload.targetUserId === 'string' ? payload.targetUserId : ''
        if (!targetUserId) return
        sendToUser(roomId, targetUserId, { type, payload: { ...payload, fromUserId: userId } })
        return
      }

      if (type === 'chat.message') {
        if (!isRecord(payload)) return
        const text = typeof payload.text === 'string' ? payload.text : ''
        if (!text) return
        const mod = moderateText(text)
        if (mod.action === 'block') {
          ws.send(JSON.stringify({ type: 'mod.notice', payload: { code: 'TEXT_BLOCKED', reason: mod.reason } }))
          return
        }
        broadcastRoomEvent(roomId, { type: 'chat.message', payload: { text, fromUserId: userId } })
      }

      if (type === 'room.kick') {
        if (!isRecord(payload)) return
        const targetUserId = typeof payload.targetUserId === 'string' ? payload.targetUserId : ''
        if (!targetUserId) return
        const currentRoom = getRoomById(roomId)
        if (!currentRoom) return
        if (currentRoom.creatorId !== userId) {
          ws.send(JSON.stringify({ type: 'mod.notice', payload: { code: 'NO_PERMISSION', reason: '仅房主可踢出' } }))
          return
        }
        removeFromRoom({ roomId, userId: targetUserId })
        const kickedSockets = roomClientsByUser.get(roomId)?.get(targetUserId)
        if (kickedSockets) {
          for (const s of kickedSockets) s.close(4000, 'kicked')
        }
        broadcastRoomEvent(roomId, { type: 'room.kick', payload: { targetUserId, byUserId: userId } })
        broadcastRoomEvent(roomId, {
          type: 'room.state',
          payload: {
            id: currentRoom.id,
            theme: currentRoom.theme,
            status: currentRoom.status,
            maxPlayers: currentRoom.maxPlayers,
            memberIds: Array.from(currentRoom.memberIds),
          },
        })
      }
    })

    ws.on('close', () => {
      const current = roomClients.get(roomId)
      if (!current) return
      current.delete(ws)
      if (current.size === 0) roomClients.delete(roomId)

      const currentUserMap = roomClientsByUser.get(roomId)
      const currentUserSet = currentUserMap?.get(userId!)
      if (currentUserSet) {
        currentUserSet.delete(ws)
        if (currentUserSet.size === 0) currentUserMap?.delete(userId!)
      }
      if (currentUserMap && currentUserMap.size === 0) roomClientsByUser.delete(roomId)

      broadcastRoomEvent(roomId, { type: 'room.leave', payload: { userId } })
    })
  })
}
