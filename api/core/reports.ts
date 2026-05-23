import crypto from 'crypto'

export type ReportTargetType = 'user' | 'message' | 'asset'

export type Report = {
  id: string
  reporterId: string
  targetType: ReportTargetType
  targetId: string
  reason: string
  evidence: unknown
  createdAt: number
}

const reportsById = new Map<string, Report>()

export function createReport(params: Omit<Report, 'id' | 'createdAt'>): Report {
  const report: Report = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    ...params,
  }
  reportsById.set(report.id, report)
  return report
}

