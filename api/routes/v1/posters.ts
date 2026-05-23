import { Router, type Request, type Response } from 'express'
import { requireUser, type AuthedRequest } from '../../core/auth.js'
import { createAsset, type AssetType } from '../../core/assets.js'

const router = Router()

router.post('/render', requireUser, (req: Request, res: Response) => {
  const authed = req as AuthedRequest
  const type = typeof req.body?.type === 'string' ? (req.body.type as AssetType) : undefined
  if (type !== 'art' && type !== 'story' && type !== 'nature') {
    res.status(400).json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid type' } })
    return
  }

  const asset = createAsset({ type, ownerId: authed.userId, payload: req.body?.payload ?? null })
  res.json({
    ok: true,
    data: {
      assetId: asset.id,
      type: asset.type,
      sharePath: `/share/${asset.id}`,
    },
  })
})

export default router

