import { gameConfig } from './config'
import { clamp, vecFromAngle, add, mul } from './math'
import { defaultPath } from './engine'
import { endPosition, startPosition } from './path'
import type { GameState } from './types'

type RenderTheme = {
  bg: string
  track: string
  trackOutline: string
  start: string
  end: string
  monster: string
  monsterStroke: string
  bullet: string
  cannon: string
  cannonStroke: string
  hudText: string
}

const theme: RenderTheme = {
  bg: '#f8fafc',
  track: '#0ea5e9',
  trackOutline: '#0369a1',
  start: '#22c55e',
  end: '#f97316',
  monster: '#ef4444',
  monsterStroke: '#7f1d1d',
  bullet: '#111827',
  cannon: '#a855f7',
  cannonStroke: '#581c87',
  hudText: '#111827',
}

export function renderFrame(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.imageSmoothingEnabled = false
  const w = gameConfig.worldTiles.w * gameConfig.tileSizePx
  const h = gameConfig.worldTiles.h * gameConfig.tileSizePx

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, w, h)

  drawTrack(ctx)
  drawStartEnd(ctx)
  drawCannons(ctx, state)
  drawBullets(ctx, state)
  drawMonsters(ctx, state)
}

function drawTrack(ctx: CanvasRenderingContext2D) {
  const points = defaultPath.points
  if (points.length < 2) return

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.strokeStyle = theme.trackOutline
  ctx.lineWidth = gameConfig.tileSizePx * 0.55
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  ctx.stroke()

  ctx.strokeStyle = theme.track
  ctx.lineWidth = gameConfig.tileSizePx * 0.35
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  ctx.stroke()
}

function drawStartEnd(ctx: CanvasRenderingContext2D) {
  const start = startPosition(defaultPath)
  const end = endPosition(defaultPath)
  const s = Math.floor(gameConfig.tileSizePx * 0.9)

  ctx.fillStyle = theme.start
  ctx.fillRect(Math.round(start.x - s / 2), Math.round(start.y - s / 2), s, s)

  ctx.fillStyle = theme.end
  ctx.fillRect(Math.round(end.x - s / 2), Math.round(end.y - s / 2), s, s)
}

function drawCannons(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const cannon of state.cannons) {
    const size = 14
    const x = Math.round(cannon.pos.x - size / 2)
    const y = Math.round(cannon.pos.y - size / 2)

    ctx.fillStyle = theme.cannon
    ctx.fillRect(x, y, size, size)
    ctx.strokeStyle = theme.cannonStroke
    ctx.lineWidth = 2
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2)

    const dir = vecFromAngle(cannon.aimAngleRad)
    const muzzle = add(cannon.pos, mul(dir, 16))
    ctx.strokeStyle = theme.cannonStroke
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(Math.round(cannon.pos.x), Math.round(cannon.pos.y))
    ctx.lineTo(Math.round(muzzle.x), Math.round(muzzle.y))
    ctx.stroke()
  }
}

function drawBullets(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = theme.bullet
  for (const b of state.bullets) {
    const r = b.radiusPx
    ctx.fillRect(Math.round(b.pos.x - r), Math.round(b.pos.y - r), r * 2, r * 2)
  }
}

function drawMonsters(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const m of state.monsters) {
    const size = 14
    const x = Math.round(m.pos.x - size / 2)
    const y = Math.round(m.pos.y - size / 2)

    ctx.fillStyle = theme.monster
    ctx.fillRect(x, y, size, size)
    ctx.strokeStyle = theme.monsterStroke
    ctx.lineWidth = 2
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2)

    const barW = 16
    const barH = 4
    const hpRatio = m.maxHp <= 0 ? 0 : clamp(m.hp / m.maxHp, 0, 1)
    const bx = Math.round(m.pos.x - barW / 2)
    const by = Math.round(m.pos.y - size / 2 - 8)
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(bx, by, barW, barH)
    ctx.fillStyle = '#16a34a'
    ctx.fillRect(bx, by, Math.round(barW * hpRatio), barH)
  }
}

