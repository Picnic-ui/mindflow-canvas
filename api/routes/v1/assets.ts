import { Router, type Request, type Response } from 'express'
import { getAsset } from '../../core/assets.js'

const router = Router()

router.get('/:assetId', (req: Request, res: Response) => {
  const assetId = req.params.assetId
  const asset = getAsset(assetId)
  if (!asset) {
    res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Asset not found' } })
    return
  }
  res.json({
    ok: true,
    data: {
      id: asset.id,
      type: asset.type,
      createdAt: asset.createdAt,
      payload: asset.payload,
    },
  })
})

export default router

