export const gameConfig = {
  tileSizePx: 16,
  worldTiles: { w: 40, h: 22 },
  spawn: {
    totalMonsters: 30,
    intervalSec: 0.8,
    baseSpeedTilesPerSec: 10,
    speedScalePerIndex: 0.03,
  },
  cannon: {
    fireIntervalSec: 1,
    aimArcDeg: 150,
    shotsSpreadDeg: 8,
    muzzleOffsetPx: 10,
  },
  bullet: {
    speedTilesPerSec: 18,
    radiusPx: 3,
  },
  monster: {
    radiusPx: 7,
  },
  damage: {
    base: 5,
  },
  skills: {
    drawEveryEffectiveDamage: 20,
  },
} as const

export function worldPx() {
  return {
    w: gameConfig.worldTiles.w * gameConfig.tileSizePx,
    h: gameConfig.worldTiles.h * gameConfig.tileSizePx,
  }
}

