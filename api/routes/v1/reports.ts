import { Router, type Request, type Response } from 'express'
import { requireUser, type AuthedRequest } from '../../core/auth.js'
import { createReport } from '../../core/reports.js'

const router = Router()

router.post('/', requireUser, (req: Request, res: Response) => {
  const authed = req as AuthedRequest
  const targetType = typeof req.body?.targetType === 'string' ? req.body.targetType : ''
  const targetId = typeof req.body?.targetId === 'string' ? req.body.targetId : ''
  const reason = typeof req.body?.reason === 'string' ? req.body.reason : ''

  if (!targetId || !reason || (targetType !== 'user' && targetType !== 'message' && targetType !== 'asset')) {
    res.status(400).json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid report' } })
    return
  }

  const report = createReport({
    reporterId: authed.userId,
    targetType,
    targetId,
    reason: reason.slice(0, 200),
    evidence: req.body?.evidence ?? null,
  })

  res.json({ ok: true, data: { reportId: report.id } })
})

export default router

