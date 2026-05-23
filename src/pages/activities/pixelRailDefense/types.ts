export type Vec2 = { x: number; y: number }

export type SkillCardId =
  | 'damage_x2'
  | 'shots_plus_1'
  | 'damage_x3'
  | 'add_cannon'
  | 'no_effect'

export type SkillCard = {
  id: SkillCardId
  title: string
  description: string
}

export type Upgrades = {
  damageMultiplier: number
  shotsPerFire: number
  cannonCount: number
}

export type Monster = {
  id: string
  index: number
  progressPx: number
  speedPxPerSec: number
  pos: Vec2
  radiusPx: number
  hp: number
  maxHp: number
  alive: boolean
}

export type Bullet = {
  id: string
  pos: Vec2
  vel: Vec2
  radiusPx: number
  damage: number
  alive: boolean
}

export type Cannon = {
  id: string
  pos: Vec2
  baseAngleRad: number
  aimAngleRad: number
  cooldownSec: number
}

export type GamePhase = 'running' | 'paused_draw' | 'win' | 'lose'

export type GameState = {
  phase: GamePhase
  elapsedSec: number

  upgrades: Upgrades

  monsters: Monster[]
  bullets: Bullet[]
  cannons: Cannon[]

  spawnIndex: number
  spawnTimerSec: number

  totalEffectiveDamage: number
  nextDrawAt: number
  pendingCard: SkillCard | null
}

export type InputState = {
  pointerWorld: Vec2 | null
}

