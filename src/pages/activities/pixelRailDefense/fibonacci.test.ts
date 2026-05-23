import { describe, expect, it } from 'vitest'
import { fibonacciSequence, monsterHpSequence } from './fibonacci'

describe('fibonacciSequence', () => {
  it('generates correct prefix', () => {
    expect(fibonacciSequence(10)).toEqual([1, 1, 2, 3, 5, 8, 13, 21, 34, 55])
  })

  it('generates 30 monster hps', () => {
    expect(monsterHpSequence.length).toBe(30)
    expect(monsterHpSequence[0]).toBe(1)
    expect(monsterHpSequence[1]).toBe(1)
    expect(monsterHpSequence[2]).toBe(2)
    expect(monsterHpSequence[29]).toBe(monsterHpSequence[28] + monsterHpSequence[27])
  })
})

