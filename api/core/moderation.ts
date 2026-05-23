export type ModerationResult =
  | { action: 'allow' }
  | { action: 'block'; reason: string }

const blockedPatterns: Array<{ re: RegExp; reason: string }> = [
  { re: /\b(wx|vx)\b/i, reason: '禁止交换联系方式' },
  { re: /微信|加我|v信|薇信/, reason: '禁止交换联系方式' },
  { re: /\bqq\b/i, reason: '禁止交换联系方式' },
  { re: /\b\d{11}\b/, reason: '疑似手机号' },
  { re: /http(s)?:\/\//i, reason: '禁止发送外链' },
]

export function moderateText(text: string): ModerationResult {
  const trimmed = text.trim()
  if (!trimmed) return { action: 'block', reason: '空内容' }
  if (trimmed.length > 200) return { action: 'block', reason: '内容过长' }
  for (const p of blockedPatterns) {
    if (p.re.test(trimmed)) return { action: 'block', reason: p.reason }
  }
  return { action: 'allow' }
}

