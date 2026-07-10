import { auditService } from '@/audit/auditService'
import { incidentRepository } from './repositories'
import type { IncidentQuery } from './types'

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}m ${remainder}s`
}

function kpis(summary: Record<string, unknown>) {
  return [
    { label: 'Active Incidents', value: summary.activeIncidents, note: `${summary.criticalIncidents} critical`, tone: 'red', filter: { status: 'active' } },
    { label: 'Critical Incidents', value: summary.criticalIncidents, note: 'Immediate autonomous response', tone: 'red', filter: { severity: 'Critical' } },
    { label: 'High-Priority Incidents', value: summary.highPriorityIncidents, note: 'Priority P2 production events', tone: 'amber', filter: { severity: 'High' } },
    { label: 'Unassigned Incidents', value: summary.unassignedIncidents, note: 'Awaiting automatic assignment', tone: 'violet', filter: { team: 'Unassigned' } },
    { label: 'Mean Time to Acknowledge', value: formatSeconds(Number(summary.meanTimeToAcknowledgeSeconds ?? 0)), note: 'Database-derived average', tone: 'blue', trend: '-12%' },
    { label: 'Mean Time to Resolve', value: `${Math.round(Number(summary.meanTimeToResolveMinutes ?? 0))}m`, note: 'Resolved incident average', tone: 'green', trend: '-8%' },
    { label: 'Resolved Today', value: summary.resolvedToday, note: 'Recovered by autonomous flow', tone: 'green', filter: { status: 'Resolved' } },
    { label: 'SLA Breaches', value: summary.slaBreaches, note: `${summary.slaAtRisk} currently at risk`, tone: 'red', filter: { slaStatus: 'Breached' } },
  ]
}

export const incidentService = {
  async dashboard(query: IncidentQuery = {}) {
    const [summary, lifecycle, queues, incidents, services, sources, responders, timeline, savedViews, filters] = await Promise.all([
      incidentRepository.summary(),
      incidentRepository.lifecycle(),
      incidentRepository.queues(),
      incidentRepository.list(query),
      incidentRepository.listSimple('incident_services'),
      incidentRepository.listSimple('incident_sources'),
      incidentRepository.listSimple('incident_responders'),
      incidentRepository.timeline(),
      incidentRepository.listSimple('incident_saved_views'),
      incidentRepository.filters(),
    ])
    return {
      summary,
      kpis: kpis(summary),
      lifecycle,
      queues,
      incidents,
      services,
      sources,
      responders,
      timeline,
      savedViews,
      filters,
      analytics: {
        severityDistribution: ['Critical', 'High', 'Medium', 'Low'].map((severity) => ({ severity, count: incidents.filter((incident) => incident.severity === severity).length })),
        activeByService: services.map((service) => ({ service: service.serviceName, count: service.activeIncidentCount, health: service.healthStatus })),
        responseHealth: Number(summary.slaBreaches) === 0 ? 'stable' : Number(summary.criticalIncidents) > 0 ? 'critical' : 'at-risk',
      },
      dataSource: 'database' as const,
    }
  },

  list(query: IncidentQuery = {}) {
    return incidentRepository.list(query)
  },

  summary: incidentRepository.summary,
  queues: incidentRepository.queues,
  analytics: async () => {
    const dashboard = await incidentService.dashboard()
    return dashboard.analytics
  },

  async get(id: string) {
    const [incident, timeline, related, responders, communications, bridge, diagnostics, remediations, rootCause, postmortem, actionItems] = await Promise.all([
      incidentRepository.get(id),
      incidentRepository.timeline(id),
      incidentRepository.related(id),
      incidentRepository.incidentSection(id, 'incident_responders'),
      incidentRepository.incidentSection(id, 'incident_communications'),
      incidentRepository.incidentSection(id, 'incident_bridge_sessions'),
      incidentRepository.incidentSection(id, 'incident_diagnostics'),
      incidentRepository.incidentSection(id, 'incident_remediations'),
      incidentRepository.incidentSection(id, 'incident_root_causes'),
      incidentRepository.incidentSection(id, 'incident_postmortems'),
      incidentRepository.incidentSection(id, 'incident_action_items'),
    ])
    await auditService.log('incident viewed', 'incidents', { incidentId: id, incidentNumber: incident.incidentNumber })
    return { incident, timeline, related, responders, communications, bridge, diagnostics, remediations, rootCause, postmortem, actionItems }
  },

  timeline(id: string) {
    return incidentRepository.timeline(id)
  },

  related(id: string) {
    return incidentRepository.related(id)
  },

  incidentSection: incidentRepository.incidentSection,

  streamDescriptor() {
    return {
      stream: 'polling-ready',
      events: ['incident.detected', 'incident.created', 'incident.triaged', 'incident.assigned', 'incident.acknowledged', 'incident.mitigated', 'incident.resolved'],
      heartbeatSeconds: 10,
      autonomousMode: true,
      dataSource: 'database',
    }
  },
}
