import { gameConfig } from './config'
import { monsterHpSequence } from './fibonacci'
import { angleTo, circlesOverlap, clampAngleInArcRad, vecFromAngle, add, mul } from './math'
import { buildPathData, endDirectionRad, endPosition, positionAtProgressPx, startPosition } from './path'
import { applySkillCard, drawSkillCard, mulberry32 } from './skills'
import type { Bullet, Cannon, GameState, InputState, Monster, SkillCard, Vec2 } from './types'

export const defaultPath = buildPathData()

type EngineRuntime = {
  rng: () => number
  idSeq: number
}

export function createGameState(seed = Date.now()): { state: GameState; runtime: EngineRuntime } {
  const rng = mulberry32(seed)
  const runtime: EngineRuntime = { rng, idSeq: 1 }
  const upgrades = { damageMultiplier: 1, shotsPerFire: 1, cannonCount: 1 }
  const baseAngleRad = endDirectionRad(defaultPath)
  const cannonPos = endPosition(defaultPath)
  const cannons = createCannons(runtime, cannonPos, baseAngleRad, upgrades.cannonCount)

  const state: GameState = {
    phase: 'running',
    elapsedSec: 0,
    upgrades,
    monsters: [],
    bullets: [],
    cannons,
    spawnIndex: 0,
    spawnTimerSec: 0,
    totalEffectiveDamage: 0,
    nextDrawAt: gameConfig.skills.drawEveryEffectiveDamage,
    pendingCard: null,
  }

  return { state, runtime }
}

export function restartGame(seed = Date.now()) {
  return createGameState(seed)
}

export function resumeAfterDraw(state: GameState) {
  if (state.phase !== 'paused_draw') return
  state.phase = 'running'
  state.pendingCard = null
}

export function updateGame(
  state: GameState,
  runtime: EngineRuntime,
  input: InputState,
  dtSec: number,
): { drawCard: SkillCard | null } {
  const dt = Math.max(0, Math.min(0.05, dtSec))
  if (state.phase !== 'running') return { drawCard: null }

  state.elapsedSec += dt

  syncCannons(state, runtime)
  updateAim(state, input)

  tickSpawner(state, runtime, dt)
  tickMonsters(state, dt)
  const lose = checkLose(state)
  if (lose) {
    state.phase = 'lose'
    return { drawCard: null }
  }

  tickCannonsFire(state, runtime, dt)
  tickBullets(state, dt)
  applyCollisions(state)

  cleanupDead(state)

  const draw = checkDrawCard(state, runtime)
  if (draw) return { drawCard: draw }

  const win = checkWin(state)
  if (win) state.phase = 'win'

  return { drawCard: null }
}

function newId(runtime: EngineRuntime, prefix: string) {
  const id = `${prefix}-${runtime.idSeq}`
  runtime.idSeq += 1
  return id
}

function createCannons(runtime: EngineRuntime, basePos: Vec2, baseAngleRad: number, count: number): Cannon[] {
  const out: Cannon[] = []
  const side = vecFromAngle(baseAngleRad + Math.PI / 2)
  const spacing = gameConfig.tileSizePx * 2.25
  const mid = (count - 1) / 2
  for (let i = 0; i < count; i++) {
    const offset = (i - mid) * spacing
    const pos = add(basePos, mul(side, offset))
    out.push({
      id: newId(runtime, 'cannon'),
      pos,
      baseAngleRad,
      aimAngleRad: baseAngleRad,
      cooldownSec: 0,
    })
  }
  return out
}

function syncCannons(state: GameState, runtime: EngineRuntime) {
  const target = state.upgrades.cannonCount
  if (state.cannons.length === target) return
  const baseAngleRad = endDirectionRad(defaultPath)
  const basePos = endPosition(defaultPath)
  if (state.cannons.length < target) {
    const extra = createCannons(runtime, basePos, baseAngleRad, target)
    state.cannons = extra.map((c, i) => {
      const prev = state.cannons[i]
      if (!prev) return c
      return { ...c, cooldownSec: prev.cooldownSec, aimAngleRad: prev.aimAngleRad }
    })
    return
  }
  state.cannons = state.cannons.slice(0, target)
}

function updateAim(state: GameState, input: InputState) {
  const halfArcRad = ((gameConfig.cannon.aimArcDeg / 2) * Math.PI) / 180
  for (const cannon of state.cannons) {
    const target = input.pointerWorld
    const raw = target ? angleTo(cannon.pos, target) : cannon.baseAngleRad
    cannon.aimAngleRad = clampAngleInArcRad(raw, cannon.baseAngleRad, halfArcRad)
  }
}

function tickSpawner(state: GameState, runtime: EngineRuntime, dt: number) {
  const cfg = gameConfig.spawn
  if (state.spawnIndex >= cfg.totalMonsters) return

  state.spawnTimerSec -= dt
  while (state.spawnTimerSec <= 0 && state.spawnIndex < cfg.totalMonsters) {
    spawnMonster(state, runtime, state.spawnIndex)
    state.spawnIndex += 1
    state.spawnTimerSec += cfg.intervalSec
  }
}

function spawnMonster(state: GameState, runtime: EngineRuntime, index: number) {
  const cfg = gameConfig.spawn
  const t = gameConfig.tileSizePx
  const start = startPosition(defaultPath)
  const speedTiles = cfg.baseSpeedTilesPerSec * (1 + index * cfg.speedScalePerIndex)
  const maxHp = monsterHpSequence[index] ?? 1
  const m: Monster = {
    id: newId(runtime, 'monster'),
    index,
    progressPx: 0,
    speedPxPerSec: speedTiles * t,
    pos: { x: start.x, y: start.y },
    radiusPx: gameConfig.monster.radiusPx,
    hp: maxHp,
    maxHp,
    alive: true,
  }
  state.monsters.push(m)
}

function tickMonsters(state: GameState, dt: number) {
  for (const m of state.monsters) {
    if (!m.alive) continue
    m.progressPx += m.speedPxPerSec * dt
    m.pos = positionAtProgressPx(defaultPath, m.progressPx)
  }
}

function checkLose(state: GameState) {
  const total = defaultPath.totalLenPx
  for (const m of state.monsters) {
    if (!m.alive) continue
    if (m.progressPx >= total) return true
  }
  return false
}

function tickCannonsFire(state: GameState, runtime: EngineRuntime, dt: number) {
  for (const cannon of state.cannons) {
    cannon.cooldownSec -= dt
    if (cannon.cooldownSec > 0) continue
    cannon.cooldownSec += gameConfig.cannon.fireIntervalSec
    fireFromCannon(state, runtime, cannon)
  }
}

function fireFromCannon(state: GameState, runtime: EngineRuntime, cannon: Cannon) {
  const shots = Math.max(1, Math.floor(state.upgrades.shotsPerFire))
  const spreadRad = ((gameConfig.cannon.shotsSpreadDeg * Math.PI) / 180) * Math.max(0, shots - 1)
  const start = cannon.aimAngleRad - spreadRad / 2
  const step = shots <= 1 ? 0 : spreadRad / (shots - 1)
  const bulletSpeed = gameConfig.bullet.speedTilesPerSec * gameConfig.tileSizePx
  const damage = gameConfig.damage.base * state.upgrades.damageMultiplier

  for (let i = 0; i < shots; i++) {
    const ang = start + step * i
    const dir = vecFromAngle(ang)
    const pos = add(cannon.pos, mul(dir, gameConfig.cannon.muzzleOffsetPx))
    const vel = mul(dir, bulletSpeed)
    const b: Bullet = {
      id: newId(runtime, 'bullet'),
      pos,
      vel,
      radiusPx: gameConfig.bullet.radiusPx,
      damage,
      alive: true,
    }
    state.bullets.push(b)
  }
}

function tickBullets(state: GameState, dt: number) {
  const t = dt
  for (const b of state.bullets) {
    if (!b.alive) continue
    b.pos = add(b.pos, mul(b.vel, t))
    if (isBulletOutOfBounds(b.pos)) b.alive = false
  }
}

function isBulletOutOfBounds(pos: Vec2) {
  const w = gameConfig.worldTiles.w * gameConfig.tileSizePx
  const h = gameConfig.worldTiles.h * gameConfig.tileSizePx
  const m = 30
  return pos.x < -m || pos.y < -m || pos.x > w + m || pos.y > h + m
}

function applyCollisions(state: GameState) {
  for (const b of state.bullets) {
    if (!b.alive) continue
    for (const m of state.monsters) {
      if (!m.alive) continue
      if (!circlesOverlap(b.pos, b.radiusPx, m.pos, m.radiusPx)) continue
      b.alive = false
      const before = m.hp
      m.hp -= b.damage
      const effective = Math.max(0, Math.min(before, b.damage))
      state.totalEffectiveDamage += effective
      if (m.hp <= 0) m.alive = false
      break
    }
  }
}

function cleanupDead(state: GameState) {
  state.bullets = state.bullets.filter((b) => b.alive)
  state.monsters = state.monsters.filter((m) => m.alive)
}

function checkDrawCard(state: GameState, runtime: EngineRuntime): SkillCard | null {
  if (state.totalEffectiveDamage < state.nextDrawAt) return null
  const card = drawSkillCard(runtime.rng)
  state.upgrades = applySkillCard(state.upgrades, card.id)
  state.pendingCard = card
  state.nextDrawAt += gameConfig.skills.drawEveryEffectiveDamage
  syncCannons(state, runtime)
  state.phase = 'paused_draw'
  return card
}

function checkWin(state: GameState) {
  return state.spawnIndex >= gameConfig.spawn.totalMonsters && state.monsters.length === 0
}

