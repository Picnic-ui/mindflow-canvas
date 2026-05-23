/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import guestRoutes from './routes/v1/guest.js'
import roomsRoutes from './routes/v1/rooms.js'
import matchmakingRoutes from './routes/v1/matchmaking.js'
import postersRoutes from './routes/v1/posters.js'
import uploadsRoutes from './routes/v1/uploads.js'
import assetsRoutes from './routes/v1/assets.js'
import plantRoutes from './routes/v1/plant.js'
import reportsRoutes from './routes/v1/reports.js'

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/v1/guest', guestRoutes)
app.use('/v1/rooms', roomsRoutes)
app.use('/v1/matchmaking', matchmakingRoutes)
app.use('/v1/posters', postersRoutes)
app.use('/v1/uploads', uploadsRoutes)
app.use('/v1/assets', assetsRoutes)
app.use('/v1/plant', plantRoutes)
app.use('/v1/reports', reportsRoutes)

/**
 * health
 */
app.use(
  '/v1/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      ok: true,
      data: { message: 'ok' },
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  void error
  void req
  void next
  res.status(500).json({
    ok: false,
    error: { code: 'SERVER_ERROR', message: 'Server internal error' },
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: { code: 'NOT_FOUND', message: 'API not found' },
  })
})

export default app
