import crypto from 'crypto'
import { Router, type Request, type Response } from 'express'
import { requireUser } from '../../core/auth.js'

const router = Router()

router.post('/sign', requireUser, (req: Request, res: Response) => {
  const kind = typeof req.body?.kind === 'string' ? req.body.kind : 'unknown'
  const assetKey = `${kind}/${crypto.randomUUID()}`
  res.json({
    ok: true,
    data: {
      assetKey,
      uploadUrl: null,
      headers: null,
    },
  })
})

export default router

