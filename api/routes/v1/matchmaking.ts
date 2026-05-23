import { Router, type Request, type Response } from 'express'
import { requireUser, type AuthedRequest } from '../../core/auth.js'
import { createRoom, getRoomById, joinRoom, store } from '../../core/store.js'

const router = Router()

router.post('/enqueue', requireUser, (req: Request, res: Response) => {
  const authed = req as AuthedRequest
  const theme = typeof req.body?.theme === 'string' && req.body.theme.trim().length > 0 ? req.body.theme.trim().slice(0, 40) : '默认主题'
  const expectedPlayersRaw = Number(req.body?.expectedPlayers)
  const expectedPlayers = Number.isFinite(expectedPlayersRaw) && expectedPlayersRaw > 0 ? Math.min(Math.floor(expectedPlayersRaw), 16) : 8
  const minStartPlayersRaw = Number(req.body?.minStartPlayers)
  const minStartPlayers = Number.isFinite(minStartPlayersRaw) && minStartPlayersRaw > 0 ? Math.min(Math.floor(minStartPlayersRaw), expectedPlayers) : 4

  const pendingRoomId = store.matchmaking.pendingRoomIdByTheme.get(theme)
  const pendingRoom = pendingRoomId ? getRoomById(pendingRoomId) : undefined

  let room = pendingRoom
  if (!room || room.memberIds.size >= room.maxPlayers || room.status !== 'lobby') {
    room = createRoom({ theme, maxPlayers: expectedPlayers, creatorId: authed.userId })
    store.matchmaking.pendingRoomIdByTheme.set(theme, room.id)
  } else {
    try {
      joinRoom({ roomId: room.id, userId: authed.userId })
    } catch {
      room = createRoom({ theme, maxPlayers: expectedPlayers, creatorId: authed.userId })
      store.matchmaking.pendingRoomIdByTheme.set(theme, room.id)
    }
  }

  if (room.memberIds.size >= room.maxPlayers) {
    store.matchmaking.pendingRoomIdByTheme.delete(theme)
  }

  res.json({
    ok: true,
    data: {
      roomId: room.id,
      theme: room.theme,
      expectedPlayers,
      minStartPlayers,
      joinedPlayers: room.memberIds.size,
      roomState: {
        id: room.id,
        theme: room.theme,
        status: room.status,
        maxPlayers: room.maxPlayers,
        memberIds: Array.from(room.memberIds),
      },
    },
  })
})

export default router
