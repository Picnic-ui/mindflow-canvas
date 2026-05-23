import type { NextFunction, Request, Response } from 'express'
import { getUserById, getUserIdByToken } from './store.js'

export type AuthedRequest = Request & { userId: string }

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  const auth = req.header('authorization') || req.header('Authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined

  if (!token) {
    res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } })
    return
  }

  const userId = getUserIdByToken(token)
  if (!userId) {
    res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } })
    return
  }

  const user = getUserById(userId)
  if (!user) {
    res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid user' } })
    return
  }

  ;(req as AuthedRequest).userId = userId
  next()
}

