import { describe, expect, it } from 'vitest'
import { clampAngleInArcRad, normalizeAngleRad } from './math'

describe('math', () => {
  it('normalizes angles into [-pi, pi]', () => {
    expect(normalizeAngleRad(Math.PI * 3)).toBeCloseTo(Math.PI)
    expect(normalizeAngleRad(-Math.PI * 3)).toBeCloseTo(-Math.PI)
  })

  it('clamps angle in arc', () => {
    const base = 0
    const half = Math.PI / 4
    expect(clampAngleInArcRad(Math.PI / 2, base, half)).toBeCloseTo(half)
    expect(clampAngleInArcRad(-Math.PI / 2, base, half)).toBeCloseTo(-half)
    expect(clampAngleInArcRad(Math.PI / 8, base, half)).toBeCloseTo(Math.PI / 8)
  })
})

