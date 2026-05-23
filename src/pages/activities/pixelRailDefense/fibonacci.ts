export function fibonacciSequence(length: number) {
  const n = Math.max(0, Math.floor(length))
  if (n === 0) return []
  if (n === 1) return [1]
  const out = new Array<number>(n)
  out[0] = 1
  out[1] = 1
  for (let i = 2; i < n; i++) out[i] = out[i - 1] + out[i - 2]
  return out
}

export const monsterHpSequence = fibonacciSequence(30)

