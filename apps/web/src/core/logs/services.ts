import { auditService } from '@/audit/auditService'
import { logsRepository } from './repositories'
import type { LogQuery } from './types'

export const logsService = {
  async dashboard(query: LogQuery = {}) {
    const [summary, volumeTrend, logEntries, logSources, errorClusters, savedViews, alertRules, investigations, retentionPolicies, filters] = await Promise.all([
      logsRepository.summary(),
      logsRepository.volumeTrend(),
      logsRepository.search(query, false),
      logsRepository.listSources(),
      logsRepository.listErrorClusters(),
      logsRepository.listSimple('log_saved_views'),
      logsRepository.listSimple('log_alert_rules'),
      logsRepository.listSimple('log_investigations'),
      logsRepository.listSimple('log_retention_policies'),
      logsRepository.filters(),
    ])
    return {
      summary,
      volumeTrend,
      logEntries,
      logSources,
      sourceHealth: logSources,
      errorClusters,
      savedViews,
      alertRules,
      investigations,
      retentionPolicies,
      recentQueries: ['level:error AND service:workflow-engine', 'durationMs:>2000', 'correlationId:"corr-0001"', 'sourceType:AI Agent AND level:Warning'],
      traceTimeline: this.traceTimeline(logEntries[0]?.traceId ?? null, logEntries),
      filters,
      dataSource: 'database' as const,
    }
  },

  search(query: LogQuery = {}) {
    return logsRepository.search(query, false)
  },

  async getLog(id: string) {
    const entry = await logsRepository.getLog(id, false)
    await auditService.log('log viewed', 'log_entries', { logEntryId: id, sensitiveHidden: entry.sensitiveHidden })
    return entry
  },

  async context(id: string) {
    const entry = await this.getLog(id)
    const related = await logsRepository.search({ traceId: entry.traceId ?? undefined, correlationId: entry.traceId ? undefined : entry.correlationId ?? undefined, pageSize: 20 })
    return { entry, related, traceTimeline: this.traceTimeline(entry.traceId, related) }
  },

  async trace(traceId: string) {
    const entries = await logsRepository.search({ traceId, pageSize: 100 })
    return { traceId, entries, timeline: this.traceTimeline(traceId, entries) }
  },

  async correlation(correlationId: string) {
    const entries = await logsRepository.search({ correlationId, pageSize: 100 })
    return { correlationId, entries, timeline: this.traceTimeline(entries[0]?.traceId ?? null, entries) }
  },

  errorClusters: logsRepository.listErrorClusters,
  sources: logsRepository.listSources,
  sourceHealth: logsRepository.listSources,
  savedViews: () => logsRepository.listSimple('log_saved_views'),
  alertRules: () => logsRepository.listSimple('log_alert_rules'),
  investigations: () => logsRepository.listSimple('log_investigations'),
  retention: () => logsRepository.listSimple('log_retention_policies'),
  summary: logsRepository.summary,

  traceTimeline(traceId: string | null, entries: Array<{ timestamp: string; serviceName: string; level: string; durationMs: number | null; message: string }>) {
    return entries.slice(0, 8).reverse().map((entry, index) => ({
      step: index + 1,
      label: index === 0 ? 'Request received' : entry.serviceName,
      startTime: entry.timestamp,
      durationMs: entry.durationMs ?? 0,
      status: ['Error', 'Critical', 'Fatal'].includes(entry.level) ? 'error' : 'ok',
      service: entry.serviceName,
      message: entry.message,
      traceId,
    }))
  },

  streamDescriptor() {
    return {
      stream: 'polling-ready',
      events: ['log.received', 'log.error', 'log.critical', 'log.cluster.created', 'log.alert.triggered', 'log.source.degraded', 'incident.created'],
      heartbeatSeconds: 15,
      dataSource: 'database',
    }
  },
}
