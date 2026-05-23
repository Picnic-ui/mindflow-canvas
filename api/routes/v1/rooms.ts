import { Router, type Request, type Response } from 'express'
import { requireUser, type AuthedRequest } from '../../core/auth.js'
import { createRoom, getRoomById, joinRoom } from '../../core/store.js'

const router = Router()

router.post('/', requireUser, (req: Request, res: Response) => {
  const authed = req as AuthedRequest
  const theme = typeof req.body?.theme === 'string' && req.body.theme.trim().length > 0 ? req.body.theme.trim().slice(0, 40) : '默认主题'
  const maxPlayersRaw = Number(req.body?.maxPlayers)
  const maxPlayers = Number.isFinite(maxPlayersRaw) && maxPlayersRaw > 0 ? Math.min(Math.floor(maxPlayersRaw), 16) : 8

  const room = createRoom({ theme, maxPlayers, creatorId: authed.userId })

  res.json({
    ok: true,
    data: {
      roomId: room.id,
      inviteCode: room.inviteCode,
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

router.post('/:roomId/join', requireUser, (req: Request, res: Response) => {
  const authed = req as AuthedRequest
  const roomId = req.params.roomId
  const inviteCode = typeof req.body?.inviteCode === 'string' ? req.body.inviteCode.trim() : undefined

  const room = getRoomById(roomId)
  if (!room) {
    res.status(404).json({ ok: false, error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' } })
    return
  }

  if (inviteCode && inviteCode !== room.inviteCode) {
    res.status(403).json({ ok: false, error: { code: 'INVITE_CODE_INVALID', message: 'Invite code invalid' } })
    return
  }

  try {
    const joined = joinRoom({ roomId, userId: authed.userId })
    res.json({
      ok: true,
      data: {
        roomState: {
          id: joined.id,
          theme: joined.theme,
          status: joined.status,
          maxPlayers: joined.maxPlayers,
          memberIds: Array.from(joined.memberIds),
        },
      },
    })
  } catch (e) {
    const code = (e as Error).message
    if (code === 'ROOM_FULL') {
      res.status(409).json({ ok: false, error: { code: 'ROOM_FULL', message: 'Room is full' } })
      return
    }
    res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: 'Server error' } })
  }
})

export default router

