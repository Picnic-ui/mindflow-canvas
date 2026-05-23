import { Router, type Request, type Response } from 'express'
import { createGuestSession } from '../../core/store.js'

const router = Router()

const defaultAvatars = ['🌿', '🎨', '☁️', '🌙', '🫧', '🍃', '🕊️', '🌼']

router.post('/session', (req: Request, res: Response) => {
  const nicknameRaw = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : ''
  const avatarRaw = typeof req.body?.avatarUrl === 'string' ? req.body.avatarUrl.trim() : ''

  const nickname = nicknameRaw.length > 0 ? nicknameRaw.slice(0, 20) : `来访者${Math.floor(Math.random() * 9000 + 1000)}`
  const avatarUrl = avatarRaw.length > 0 ? avatarRaw : defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)]

  const { user, token } = createGuestSession({ nickname, avatarUrl })

  res.json({
    ok: true,
    data: {
      userId: user.id,
      token,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    },
  })
})

export default router

