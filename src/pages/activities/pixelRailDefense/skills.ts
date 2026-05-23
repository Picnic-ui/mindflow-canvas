import type { SkillCard, SkillCardId, Upgrades } from './types'

export const skillCards: SkillCard[] = [
  { id: 'damage_x2', title: '炮弹伤害翻一倍', description: '伤害倍率 ×2' },
  { id: 'shots_plus_1', title: '每次可发射炮弹数量加一', description: '每次发射 +1 枚' },
  { id: 'damage_x3', title: '炮弹伤害翻三倍', description: '伤害倍率 ×3' },
  { id: 'add_cannon', title: '旁边增加一台大炮', description: '大炮数量 +1' },
  { id: 'no_effect', title: '抽我干嘛', description: '什么也不会发生' },
]

export function mulberry32(seed: number) {
  let t = seed >>> 0
  return function next() {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

export function drawSkillCard(rng: () => number): SkillCard {
  const idx = Math.floor(rng() * skillCards.length)
  return skillCards[Math.min(skillCards.length - 1, Math.max(0, idx))]
}

export function applySkillCard(upgrades: Upgrades, cardId: SkillCardId): Upgrades {
  if (cardId === 'damage_x2') return { ...upgrades, damageMultiplier: upgrades.damageMultiplier * 2 }
  if (cardId === 'damage_x3') return { ...upgrades, damageMultiplier: upgrades.damageMultiplier * 3 }
  if (cardId === 'shots_plus_1') return { ...upgrades, shotsPerFire: upgrades.shotsPerFire + 1 }
  if (cardId === 'add_cannon') return { ...upgrades, cannonCount: upgrades.cannonCount + 1 }
  return upgrades
}

