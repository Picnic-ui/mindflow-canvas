import { Router, type Request, type Response } from 'express'
import { requireUser } from '../../core/auth.js'

const router = Router()

router.post('/identify', requireUser, async (req: Request, res: Response) => {
  const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl : null
  const assetKey = typeof req.body?.assetKey === 'string' ? req.body.assetKey : null

  const apiKey = process.env.PLANTNET_API_KEY

  if (!apiKey) {
    res.json({
      ok: true,
      data: {
        provider: 'mock',
        input: { imageUrl, assetKey },
        results: [
          { name: '未识别（占位）', score: 0.0, hint: '上传更清晰的叶脉/花瓣特写，会更容易识别。' },
        ],
      },
    })
    return
  }

  res.json({
    ok: true,
    data: {
      provider: 'plantnet',
      input: { imageUrl, assetKey },
      results: [],
      note: '已配置 PLANTNET_API_KEY，但 1.0.0 暂未接入真实图片上传到可公开访问 URL 的链路。',
    },
  })
})

export default router

