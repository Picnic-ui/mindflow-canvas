import { type PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import ActivityLayout from './ActivityLayout'
import { gameConfig, worldPx } from './pixelRailDefense/config'
import { createGameState, restartGame, resumeAfterDraw, updateGame } from './pixelRailDefense/engine'
import { renderFrame } from './pixelRailDefense/render'
import type { GamePhase, InputState, SkillCard, Upgrades } from './pixelRailDefense/types'

type UiSnapshot = {
  phase: GamePhase
  upgrades: Upgrades
  spawned: number
  alive: number
  totalEffectiveDamage: number
  nextDrawAt: number
  pendingCard: SkillCard | null
}

function snapshot(ui: ReturnType<typeof createGameState>['state']): UiSnapshot {
  return {
    phase: ui.phase,
    upgrades: ui.upgrades,
    spawned: ui.spawnIndex,
    alive: ui.monsters.length,
    totalEffectiveDamage: ui.totalEffectiveDamage,
    nextDrawAt: ui.nextDrawAt,
    pendingCard: ui.pendingCard,
  }
}

export default function PixelRailDefense() {
  const { w, h } = useMemo(() => worldPx(), [])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const inputRef = useRef<InputState>({ pointerWorld: null })
  const engineRef = useRef(createGameState())
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const uiTickRef = useRef(0)

  const [ui, setUi] = useState<UiSnapshot>(() => snapshot(engineRef.current.state))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function frame(ts: number) {
      const last = lastTsRef.current ?? ts
      lastTsRef.current = ts
      const dt = (ts - last) / 1000

      updateGame(engineRef.current.state, engineRef.current.runtime, inputRef.current, dt)
      renderFrame(ctx, engineRef.current.state)

      uiTickRef.current += dt
      if (uiTickRef.current >= 0.1) {
        uiTickRef.current = 0
        setUi(snapshot(engineRef.current.state))
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastTsRef.current = null
    }
  }, [])

  function toWorld(clientX: number, clientY: number) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * canvas.width
    const y = ((clientY - rect.top) / rect.height) * canvas.height
    return { x, y }
  }

  function handlePointerMove(e: PointerEvent<HTMLCanvasElement>) {
    const p = toWorld(e.clientX, e.clientY)
    inputRef.current.pointerWorld = p
  }

  function handlePointerLeave() {
    inputRef.current.pointerWorld = null
  }

  function handleContinue() {
    resumeAfterDraw(engineRef.current.state)
    setUi(snapshot(engineRef.current.state))
  }

  function handleRestart() {
    engineRef.current = restartGame(Date.now())
    inputRef.current.pointerWorld = null
    lastTsRef.current = null
    uiTickRef.current = 0
    setUi(snapshot(engineRef.current.state))
  }

  const damage = gameConfig.damage.base * ui.upgrades.damageMultiplier

  return (
    <ActivityLayout title="像素轨道炮塔（1.0）" subtitle="怪物沿自交轨道推进；终点炮塔自动射击（瞄准受 150° 限制）；累计有效减血每到 20 抽一次卡。">
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2 text-xs text-zinc-700">
          <div className="rounded-2xl border border-zinc-900/10 bg-white px-3 py-2">
            剩余怪物：{ui.alive}（已生成 {Math.min(ui.spawned, gameConfig.spawn.totalMonsters)}/{gameConfig.spawn.totalMonsters}）
          </div>
          <div className="rounded-2xl border border-zinc-900/10 bg-white px-3 py-2">
            累计有效减血：{ui.totalEffectiveDamage}/{ui.nextDrawAt}
          </div>
          <div className="rounded-2xl border border-zinc-900/10 bg-white px-3 py-2">
            伤害：{damage}
          </div>
          <div className="rounded-2xl border border-zinc-900/10 bg-white px-3 py-2">
            每次发射：{ui.upgrades.shotsPerFire}
          </div>
          <div className="rounded-2xl border border-zinc-900/10 bg-white px-3 py-2">
            大炮数量：{ui.upgrades.cannonCount}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-zinc-900/10 bg-white">
          <canvas
            ref={canvasRef}
            width={w}
            height={h}
            className="block h-auto w-full bg-white"
            style={{ imageRendering: 'pixelated', touchAction: 'none' }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          />

          {ui.phase === 'paused_draw' && ui.pendingCard && (
            <div className="absolute inset-0 grid place-items-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-3xl bg-white p-6">
                <div className="text-xs tracking-[0.28em] text-emerald-700/70">SKILL CARD</div>
                <div className="mt-2 text-xl font-semibold text-zinc-900">{ui.pendingCard.title}</div>
                <div className="mt-2 text-sm text-zinc-600">{ui.pendingCard.description}</div>
                <button
                  className="mt-5 w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                  onClick={handleContinue}
                >
                  继续
                </button>
              </div>
            </div>
          )}

          {ui.phase !== 'running' && ui.phase !== 'paused_draw' && (
            <div className="absolute inset-0 grid place-items-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-3xl bg-white p-6">
                <div className="text-xs tracking-[0.28em] text-emerald-700/70">RESULT</div>
                <div className="mt-2 text-xl font-semibold text-zinc-900">{ui.phase === 'win' ? '胜利' : '失败'}</div>
                <div className="mt-2 text-sm text-zinc-600">
                  最终：伤害 {damage} / 每次 {ui.upgrades.shotsPerFire} 发 / {ui.upgrades.cannonCount} 门炮
                </div>
                <button
                  className="mt-5 w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                  onClick={handleRestart}
                >
                  重开
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-2xl border border-zinc-900/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            onClick={handleRestart}
          >
            重新开始
          </button>
          <div className="text-xs text-zinc-500">
            鼠标/手指移动即可瞄准；若进入抽卡会暂停，点击“继续”恢复。
          </div>
        </div>
      </div>
    </ActivityLayout>
  )
}
