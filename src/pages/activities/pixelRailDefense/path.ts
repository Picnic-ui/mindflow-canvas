import { gameConfig } from './config'
import type { Vec2 } from './types'
import { len, sub } from './math'

export type PathSegment = {
  a: Vec2
  b: Vec2
  lenPx: number
  accPx: number
}

export type PathData = {
  points: Vec2[]
  segments: PathSegment[]
  totalLenPx: number
}

export const pathTiles: Array<{ x: number; y: number }> = [
  { x: 2, y: 3 },
  { x: 20, y: 3 },
  { x: 20, y: 10 },
  { x: 8, y: 10 },
  { x: 8, y: 6 },
  { x: 28, y: 6 },
  { x: 28, y: 16 },
  { x: 12, y: 16 },
  { x: 12, y: 4 },
  { x: 36, y: 4 },
  { x: 36, y: 18 },
  { x: 18, y: 18 },
  { x: 18, y: 20 },
  { x: 38, y: 20 },
]

export function tileCenterPx(tile: { x: number; y: number }): Vec2 {
  const t = gameConfig.tileSizePx
  return { x: tile.x * t + t / 2, y: tile.y * t + t / 2 }
}

export function buildPathData(tiles = pathTiles): PathData {
  const points = tiles.map(tileCenterPx)
  const segments: PathSegment[] = []
  let acc = 0
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    const d = len(sub(b, a))
    segments.push({ a, b, lenPx: d, accPx: acc })
    acc += d
  }
  return { points, segments, totalLenPx: acc }
}

export function positionAtProgressPx(path: PathData, progressPx: number): Vec2 {
  if (path.segments.length === 0) return { x: 0, y: 0 }
  const p = Math.max(0, Math.min(path.totalLenPx, progressPx))
  for (let i = path.segments.length - 1; i >= 0; i--) {
    const seg = path.segments[i]
    if (p >= seg.accPx) {
      const local = p - seg.accPx
      const t = seg.lenPx <= 0.000001 ? 0 : local / seg.lenPx
      return { x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t }
    }
  }
  const first = path.segments[0]
  return { x: first.a.x, y: first.a.y }
}

export function endDirectionRad(path: PathData) {
  if (path.segments.length === 0) return 0
  const last = path.segments[path.segments.length - 1]
  return Math.atan2(last.a.y - last.b.y, last.a.x - last.b.x)
}

export function startPosition(path: PathData) {
  return path.points[0] ?? { x: 0, y: 0 }
}

export function endPosition(path: PathData) {
  return path.points[path.points.length - 1] ?? { x: 0, y: 0 }
}

