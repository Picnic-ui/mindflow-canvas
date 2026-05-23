import { describe, expect, it } from 'vitest'
import { createGameState, resumeAfterDraw, updateGame } from './engine'

describe('draw thresholds', () => {
  it('does not draw before reaching threshold', () => {
    const { state, runtime } = createGameState(1)
    state.totalEffectiveDamage = 19
    state.nextDrawAt = 20
    updateGame(state, runtime, { pointerWorld: null }, 0)
    expect(state.phase).toBe('running')
    expect(state.pendingCard).toBe(null)
    expect(state.nextDrawAt).toBe(20)
  })

  it('draws once when reaching threshold and pauses', () => {
    const { state, runtime } = createGameState(2)
    state.totalEffectiveDamage = 20
    state.nextDrawAt = 20
    updateGame(state, runtime, { pointerWorld: null }, 0)
    expect(state.phase).toBe('paused_draw')
    expect(state.pendingCard).not.toBe(null)
    expect(state.nextDrawAt).toBe(40)
  })

  it('supports sequential draws across multiple thresholds after resume', () => {
    const { state, runtime } = createGameState(3)
    state.totalEffectiveDamage = 41
    state.nextDrawAt = 20
    updateGame(state, runtime, { pointerWorld: null }, 0)
    expect(state.phase).toBe('paused_draw')
    expect(state.nextDrawAt).toBe(40)
    resumeAfterDraw(state)
    updateGame(state, runtime, { pointerWorld: null }, 0)
    expect(state.phase).toBe('paused_draw')
    expect(state.nextDrawAt).toBe(60)
  })
})

