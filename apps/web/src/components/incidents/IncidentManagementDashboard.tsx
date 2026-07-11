'use client'

import { Activity, AlertCircle, Bell, Clock3, Database, GitBranch, HeartPulse, ListFilter, Radio, Search, ShieldAlert, Siren, Users, Workflow, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Incident = {
  id: string
  incidentNumber: string
  title: string
  description: string | null
  sourceType: string
  severity: string
  priority: string
  status: string
  environment: string
  affectedService: string | null
  affectedModule: string | null
  customerImpact: string
  impactScope: string | null
  assignedTeam: string | null
  incidentCommander: string | null
  acknowledgedAt: string | null
  investigatingAt: string | null
  mitigatedAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  slaDeadline: string | null
  slaStatus: string | null
  minutesRemaining: number | null
  rootCauseStatus: string
  resolutionSummary: string | null
  detectionSignal: string | null
  escalationLevel: number
  communicationStatus: string
  relatedAlerts: number
  relatedLogs: number
  relatedWorkflows: number
  relatedJobs: number
  durationMinutes: number
  createdAt: string
  updatedAt: string
}

type IncidentData = {
  summary: Record<string, unknown>
  kpis: Array<Record<string, unknown>>
  lifecycle: Array<Record<string, unknown>>
  queues: Array<Record<string, unknown>>
  incidents: Incident[]
  services: Array<Record<string, unknown>>
  sources: Array<Record<string, unknown>>
  responders: Array<Record<string, unknown>>
  timeline: Array<Record<string, unknown>>
  savedViews: Array<Record<string, unknown>>
  filters: Record<string, string[]>
  analytics: Record<string, unknown>
  dataSource: string
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

const emptyData: IncidentData = {
  summary: {},
  kpis: [],
  lifecycle: [],
  queues: [],
  incidents: [],
  services: [],
  sources: [],
  responders: [],
  timeline: [],
  savedViews: [],
  filters: {},
  analytics: {},
  dataSource: 'database',
}

const severityClass: Record<string, string> = {
  Critical: 'critical',
  High: 'high',
  Medium: 'medium',
  Low: 'low',
}

function fmt(value: unknown) {
  return value === null || value === undefined || value === '' ? '-' : String(value)
}

function fmtTime(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value))
}

function fmtDuration(minutes: unknown) {
  const value = Number(minutes ?? 0)
  if (value < 60) return `${Math.max(0, Math.round(value))}m`
  return `${Math.floor(value / 60)}h ${Math.round(value % 60)}m`
}

function StatusPill({ value }: { value: string }) {
  return <span className={`incident-pill ${severityClass[value] ?? value.toLowerCase().replace(/\s+/g, '-')}`}>{value}</span>
}

function KpiCard({ icon: Icon, item }: { icon: LucideIcon; item: Record<string, unknown> }) {
  return (
    <article className="incident-kpi-card" title={String(item.note ?? item.label ?? '')}>
      <span className={`incident-kpi-icon ${fmt(item.tone)}`}><Icon size={18} /></span>
      <div>
        <small>{fmt(item.label)}</small>
        <b>{fmt(item.value)}</b>
        <p>{fmt(item.note)} {item.trend ? <span>{fmt(item.trend)}</span> : null}</p>
      </div>
    </article>
  )
}

function HeaderMeta({ data, now }: { data: IncidentData; now: Date | null }) {
  const synchronizedAt = data.summary.lastSynchronizedAt ? fmtTime(String(data.summary.lastSynchronizedAt)) : now ? fmtTime(now.toISOString()) : '-'
  return (
    <div className="incident-header-meta">
      <span><Radio size={14} /> {fmt(data.summary.monitoringStatus)} monitoring</span>
      <span><Clock3 size={14} /> {synchronizedAt}</span>
      <span><Database size={14} /> {fmt(data.dataSource)}</span>
      <span><Users size={14} /> {fmt(data.summary.onCallTeam)}</span>
      <span>{fmt(data.summary.environment)}</span>
    </div>
  )
}

function CommandCenter({ data }: { data: IncidentData }) {
  const active = data.incidents.filter((incident) => !['Resolved', 'Closed'].includes(incident.status))
  const bySeverity = ['Critical', 'High', 'Medium', 'Low'].map((severity) => ({ severity, count: active.filter((incident) => incident.severity === severity).length }))
  return (
    <section className="incident-command-grid">
      <article className="incident-card span-2">
        <div className="incident-section-head"><div><h2>Incident Command Center</h2><p>Autonomous detection, triage, escalation, communication, and remediation status.</p></div><span>live database</span></div>
        <div className="incident-command-layout">
          <div className="incident-severity-bars">
            {bySeverity.map((item) => (
              <div key={item.severity}><span>{item.severity}</span><b>{item.count}</b><i style={{ width: `${Math.max(4, item.count * 18)}%` }} /></div>
            ))}
          </div>
          <div className="incident-service-list">
            {data.services.slice(0, 8).map((service) => (
              <div key={String(service.id)}>
                <span>{fmt(service.serviceName)}</span>
                <b>{fmt(service.activeIncidentCount)}</b>
                <StatusPill value={fmt(service.healthStatus)} />
              </div>
            ))}
          </div>
          <div className="incident-health-stack">
            <span><AlertCircle size={16} /> {fmt(data.summary.unassignedIncidents)} unassigned</span>
            <span><Clock3 size={16} /> {fmt(data.summary.slaAtRisk)} SLA at risk</span>
            <span><Users size={16} /> {data.responders.filter((responder) => String(responder.incidentId ?? '') === '').length || data.responders.length} on-call responders</span>
            <span><Bell size={16} /> Automated communications active</span>
          </div>
        </div>
      </article>

      <article className="incident-card incident-timeline-card">
        <div className="incident-section-head"><div><h2>Activity Timeline</h2><p>Latest system-generated incident events.</p></div></div>
        <div className="incident-timeline">
          {data.timeline.slice(0, 9).map((event) => (
            <div key={String(event.id)}>
              <time>{fmtTime(String(event.eventTime))}</time>
              <b>{fmt(event.eventTitle)}</b>
              <span>{fmt(event.incidentNumber)} · {fmt(event.actorName)}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}

function LifecyclePipeline({ stages }: { stages: Array<Record<string, unknown>> }) {
  return (
    <section className="incident-card">
      <div className="incident-section-head"><div><h2>Incident Lifecycle Pipeline</h2><p>Stage counts, durations, SLA risk, blocked incidents, owners, and progress from incident tables.</p></div><span>autonomous</span></div>
      <div className="incident-pipeline">
        {stages.map((stage) => (
          <article key={String(stage.stageName)}>
            <span>{fmt(stage.stageOrder)}</span>
            <h3>{fmt(stage.stageName)}</h3>
            <b>{fmt(stage.incidentCount)}</b>
            <p>{fmtDuration(stage.averageDurationMinutes)} avg</p>
            <small>{fmt(stage.slaRisk)} SLA risk · {fmt(stage.blockedIncidents)} blocked</small>
            <div><i style={{ width: `${Number(stage.completionPercentage ?? 0)}%` }} /></div>
            <em>{fmt(stage.currentOwners)}</em>
          </article>
        ))}
      </div>
    </section>
  )
}

function QueueGrid({ queues }: { queues: Array<Record<string, unknown>> }) {
  return (
    <section className="incident-card">
      <div className="incident-section-head"><div><h2>Incident Queues</h2><p>Queues are opened by the autonomous incident-management workflow.</p></div></div>
      <div className="incident-queue-grid">
        {queues.map((queue) => (
          <article key={String(queue.queueName)}>
            <h3>{fmt(queue.queueName)}</h3>
            <b>{fmt(queue.incidentCount)}</b>
            <p>Oldest {fmtTime(queue.oldestIncident as string | null)}</p>
            <span>{fmtDuration(queue.averageAgeMinutes)} avg age</span>
            <small>{fmt(queue.assignedResponders)} responders · {fmt(queue.slaRisk)} SLA risk</small>
            <StatusPill value={fmt(queue.queueHealth)} />
          </article>
        ))}
      </div>
    </section>
  )
}

function IncidentTable({ incidents, selectedId, onSelect }: { incidents: Incident[]; selectedId?: string; onSelect: (incident: Incident) => void }) {
  const heads = ['Incident ID','Title','Severity','Priority','Status','Source','Affected Service','Module','Environment','Customer Impact','Impact Scope','Created At','Acknowledged At','Duration','SLA Deadline','SLA Status','Assigned Team','Incident Commander','Related Alerts','Related Logs','Related Workflow','Root Cause','Resolution']
  return (
    <section className="incident-card">
      <div className="incident-section-head"><div><h2>Incidents</h2><p>{incidents.length} rows loaded from incidents, SLA tracking, and relationship tables.</p></div><span>server-ready</span></div>
      <div className="incident-table-wrap">
        <table className="incident-table">
          <thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr></thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id} className={incident.id === selectedId ? 'selected' : ''} onClick={() => onSelect(incident)}>
                <td>{incident.incidentNumber}</td>
                <td className="incident-title-cell">{incident.title}</td>
                <td><StatusPill value={incident.severity} /></td>
                <td>{incident.priority}</td>
                <td><StatusPill value={incident.status} /></td>
                <td>{incident.sourceType}</td>
                <td>{incident.affectedService ?? '-'}</td>
                <td>{incident.affectedModule ?? '-'}</td>
                <td>{incident.environment}</td>
                <td>{incident.customerImpact}</td>
                <td>{incident.impactScope ?? '-'}</td>
                <td>{fmtTime(incident.createdAt)}</td>
                <td>{fmtTime(incident.acknowledgedAt)}</td>
                <td>{fmtDuration(incident.durationMinutes)}</td>
                <td>{fmtTime(incident.slaDeadline)}</td>
                <td>{incident.slaStatus ? <StatusPill value={incident.slaStatus} /> : '-'}</td>
                <td>{incident.assignedTeam ?? 'Autonomous assignment pending'}</td>
                <td>{incident.incidentCommander ?? '-'}</td>
                <td>{incident.relatedAlerts}</td>
                <td>{incident.relatedLogs}</td>
                <td>{incident.relatedWorkflows}</td>
                <td>{incident.rootCauseStatus}</td>
                <td>{incident.resolutionSummary ?? '-'}</td>
              </tr>
            ))}
            {incidents.length === 0 ? <tr><td colSpan={heads.length}>No incidents match the current database filters.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function IncidentDetails({ incident }: { incident: Incident | null }) {
  if (!incident) {
    return (
      <aside className="incident-card incident-detail">
        <h2>Incident Detail</h2>
        <p>Select an incident row to inspect database-backed overview, ownership, affected systems, timeline context, mitigation, resolution, and postmortem state.</p>
      </aside>
    )
  }
  return (
    <aside className="incident-card incident-detail">
      <h2>{incident.incidentNumber}</h2>
      <StatusPill value={incident.severity} />
      <h3>{incident.title}</h3>
      <p>{incident.description}</p>
      <dl>
        {[
          ['Status', incident.status],
          ['Priority', incident.priority],
          ['Source', incident.sourceType],
          ['Service', incident.affectedService],
          ['Module', incident.affectedModule],
          ['Environment', incident.environment],
          ['Customer Impact', incident.customerImpact],
          ['Impact Scope', incident.impactScope],
          ['Assigned Team', incident.assignedTeam ?? 'Autonomous assignment pending'],
          ['Incident Commander', incident.incidentCommander],
          ['SLA Deadline', fmtTime(incident.slaDeadline)],
          ['SLA Status', incident.slaStatus],
          ['Detection Signal', incident.detectionSignal],
          ['Escalation Level', incident.escalationLevel],
          ['Communication', incident.communicationStatus],
          ['Root Cause', incident.rootCauseStatus],
          ['Resolution', incident.resolutionSummary],
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{fmt(value)}</dd></div>)}
      </dl>
    </aside>
  )
}

function QueryBar({ query, setQuery, filters, selectedFilters, setSelectedFilters }: {
  query: string
  setQuery: (value: string) => void
  filters: Record<string, string[]>
  selectedFilters: Record<string, string>
  setSelectedFilters: (value: Record<string, string>) => void
}) {
  const keys = ['severity', 'priority', 'status', 'source', 'service', 'module', 'environment', 'team', 'slaStatus', 'customerImpact']
  return (
    <section className="incident-query-card">
      <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search incidents, services, sources, modules, references..." /></label>
      <div>
        {keys.map((key) => (
          <label key={key}>{key}<select value={selectedFilters[key] ?? 'All'} onChange={(event) => setSelectedFilters({ ...selectedFilters, [key]: event.target.value })}><option>All</option>{(filters[key] ?? []).map((value) => <option key={value}>{value}</option>)}</select></label>
        ))}
      </div>
    </section>
  )
}

export function IncidentManagementDashboard() {
  const [data, setData] = useState<IncidentData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [now, setNow] = useState<Date | null>(null)

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    Object.entries(selectedFilters).forEach(([key, value]) => value && value !== 'All' && params.set(key, value))
    return `/api/v1/system-monitoring/incidents${params.toString() ? `?${params}` : ''}`
  }, [query, selectedFilters])

  const load = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(apiUrl, { cache: 'no-store' })
      const payload = (await response.json()) as ApiEnvelope<IncidentData>
      if (!response.ok || !payload.success) throw new Error(payload.message || 'Incident dashboard request failed.')
      setData(payload.data)
      setSelectedId((current) => current ?? payload.data.incidents[0]?.id ?? null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load incident dashboard.')
    } finally {
      setLoading(false)
    }
  }, [apiUrl])

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0)
    const poll = window.setInterval(() => void load(), 5000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(poll)
    }
  }, [load])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const selectedIncident = data.incidents.find((incident) => incident.id === selectedId) ?? data.incidents[0] ?? null
  const kpiIcons = [Siren, ShieldAlert, AlertCircle, Users, Clock3, HeartPulse, Zap, Bell]

  return (
    <main className="incident-page">
      <header className="incident-header">
        <div>
          <nav>System Monitoring / Incident Management</nav>
          <h1>Incident Management</h1>
          <p>Detect, prioritize, investigate, resolve, and review operational incidents across the AI Media Operating System.</p>
          <HeaderMeta data={data} now={now} />
        </div>
        <div className="incident-live-clock"><Clock3 size={16} /> {now ? new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now) : 'Loading Nigeria time'}</div>
      </header>

      {error ? <div className="incident-error">{error}</div> : null}
      {loading ? <div className="incident-loading">Loading incident database state...</div> : null}

      <section className="incident-kpi-grid">
        {(data.kpis.length ? data.kpis : emptyData.kpis).map((item, index) => <KpiCard key={String(item.label)} icon={kpiIcons[index] ?? Activity} item={item} />)}
      </section>

      <CommandCenter data={data} />
      <LifecyclePipeline stages={data.lifecycle} />
      <QueueGrid queues={data.queues} />
      <QueryBar query={query} setQuery={setQuery} filters={data.filters} selectedFilters={selectedFilters} setSelectedFilters={setSelectedFilters} />

      <section className="incident-main-grid">
        <div>
          <IncidentTable incidents={data.incidents} selectedId={selectedIncident?.id} onSelect={(incident) => setSelectedId(incident.id)} />
        </div>
        <IncidentDetails incident={selectedIncident} />
      </section>

      <section className="incident-card incident-bottom-grid">
        <article><ListFilter size={18} /><h3>Saved Views</h3><p>{data.savedViews.map((view) => fmt(view.name)).join(', ') || 'No saved views'}</p></article>
        <article><GitBranch size={18} /><h3>Related Systems</h3><p>Alerts, logs, traces, workflows, agent runs, and jobs are linked automatically.</p></article>
        <article><Workflow size={18} /><h3>Autonomous Workflow</h3><p>Incident response, escalation, remediation, communication, resolution, postmortem, and action item follow-up run without page-level manual controls.</p></article>
      </section>
    </main>
  )
}
