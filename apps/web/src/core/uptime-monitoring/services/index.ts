import { auditService } from '@/audit/auditService'
import { workflowQueueService } from '@/core/queue/services/workflowQueueService'
import { uptimeMonitorRepository } from '../repositories'
import type { UptimeDashboardData, UptimeMonitor } from '../types'

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

export const uptimeMonitoringService = {
  async summary(monitors?: UptimeMonitor[]) {
    const rows = monitors ?? await uptimeMonitorRepository.listMonitors()
    const incidents = await uptimeMonitorRepository.listIncidents()
    const sla = await uptimeMonitorRepository.listSla()
    const operational = rows.filter((monitor) => monitor.status === 'Operational').length
    const degraded = rows.filter((monitor) => monitor.status === 'Degraded' || monitor.status === 'Partial Outage').length
    const offline = rows.filter((monitor) => monitor.status === 'Major Outage').length
    const compliant = sla.filter((row) => row.breachStatus === 'Compliant').length
    return {
      overallUptime: Number(average(rows.map((monitor) => monitor.uptime30d)).toFixed(2)),
      operationalMonitors: operational,
      healthyMonitors: rows.filter((monitor) => monitor.status === 'Operational' || monitor.status === 'Maintenance').length,
      degradedMonitors: degraded,
      offlineMonitors: offline,
      averageResponseTimeMs: Math.round(average(rows.map((monitor) => monitor.responseTimeMs))),
      slaCompliance: Number((sla.length ? (compliant / sla.length) * 100 : 0).toFixed(1)),
      compliantServices: compliant,
      totalServices: rows.length,
      incidentsThisMonth: incidents.length,
      resolvedIncidents: incidents.filter((incident) => incident.status === 'Resolved').length,
      totalDowntimeMinutes: rows.reduce((sum, monitor) => sum + monitor.downtimeMinutes, 0),
      lastChecked: rows.map((monitor) => monitor.lastChecked).filter(Boolean).sort().at(-1) ?? null,
    }
  },

  async dashboard(): Promise<UptimeDashboardData> {
    const monitors = await uptimeMonitorRepository.listMonitors()
    const [summary, availabilityHistory, incidents, sla, maintenanceWindows, regionalMetrics] = await Promise.all([
      this.summary(monitors),
      uptimeMonitorRepository.listHistory(),
      uptimeMonitorRepository.listIncidents(),
      uptimeMonitorRepository.listSla(),
      uptimeMonitorRepository.listMaintenance(),
      uptimeMonitorRepository.listRegionalMetrics(),
    ])
    return {
      summary,
      monitors,
      availabilityHistory,
      incidents,
      sla,
      maintenanceWindows,
      regionalMetrics,
      alerts: [
        `${summary.offlineMonitors} service offline`,
        `${sla.filter((row) => row.breachStatus === 'Breached').length} SLA breaches`,
        `${monitors.filter((monitor) => monitor.responseTimeMs > 500).length} high-latency monitors`,
      ],
      atRiskServices: sla.filter((row) => row.breachStatus !== 'Compliant').slice(0, 6).map((row) => row.service),
      recommendations: ['Increase check frequency for degraded external APIs', 'Open incident for active outages', 'Review provider status before publishing windows', 'Schedule maintenance for aging cache nodes'],
      recentChanges: ['Monitor created: AI Provider Gateway', 'Threshold updated: Video Render Engine', 'Service paused: Payment Gateway', 'Incident resolved: Creative Agents latency'],
      dataSource: 'database',
    }
  },

  monitors() {
    return uptimeMonitorRepository.listMonitors()
  },

  monitor(id: string) {
    return uptimeMonitorRepository.getMonitor(id)
  },

  history(id?: string) {
    return uptimeMonitorRepository.listHistory(id)
  },

  incidents() {
    return uptimeMonitorRepository.listIncidents()
  },

  sla() {
    return uptimeMonitorRepository.listSla()
  },

  maintenance() {
    return uptimeMonitorRepository.listMaintenance()
  },

  async runCheck(monitorId?: string) {
    await workflowQueueService.enqueue('uptime-monitoring', { runId: crypto.randomUUID(), agentCode: 'run-monitor-check', correlationId: crypto.randomUUID() })
    const result = await uptimeMonitorRepository.createManualCheck(monitorId)
    await auditService.log('manual check executed', 'uptime_monitors', result)
    return result
  },

  async pause(id: string) {
    const monitor = await uptimeMonitorRepository.updateMonitorStatus(id, 'Paused')
    await auditService.log('monitor paused', 'uptime_monitors', { monitorId: id })
    return monitor
  },

  async resume(id: string) {
    const monitor = await uptimeMonitorRepository.updateMonitorStatus(id, 'Operational')
    await auditService.log('monitor resumed', 'uptime_monitors', { monitorId: id })
    return monitor
  },
}
