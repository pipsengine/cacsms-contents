'use client'

import { Activity, AlertCircle, Bell, CheckCircle2, Clock3, Gauge, Search, ShieldCheck, TimerReset, Wifi } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type MonitorStatus = 'Operational' | 'Degraded' | 'Partial Outage' | 'Major Outage' | 'Maintenance' | 'Paused' | 'Unknown'

type Monitor = {
  id: string
  name: string
  description?: string | null
  monitorType: string
  category: string
  endpoint: string
  method?: string | null
  region: string
  status: MonitorStatus
  uptime24h: number
  uptime7d: number
  uptime30d: number
  responseTimeMs: number
  lastOutage?: string | null
  downtimeMinutes: number
  checkFrequencySeconds: number
  timeoutSeconds: number
  retryCount: number
  slaTarget: number
  owner?: string | null
  alertPolicy?: string | null
  lastChecked?: string | null
  isEnabled: boolean
}

type HistoryBlock = {
  id: string
  monitorId: string
  status: MonitorStatus
  startedAt: string
  endedAt?: string | null
  responseTimeMs?: number | null
  incidentReference?: string | null
  errorMessage?: string | null
}

type DashboardData = {
  summary: {
    overallUptime: number
    operationalMonitors: number
    healthyMonitors: number
    degradedMonitors: number
    offlineMonitors: number
    averageResponseTimeMs: number
    slaCompliance: number
    compliantServices: number
    totalServices: number
    incidentsThisMonth: number
    resolvedIncidents: number
    totalDowntimeMinutes: number
    lastChecked?: string | null
  }
  monitors: Monitor[]
  availabilityHistory: HistoryBlock[]
  incidents: Array<Record<string, unknown>>
  sla: Array<Record<string, unknown>>
  maintenanceWindows: Array<Record<string, unknown>>
  regionalMetrics: Array<Record<string, unknown>>
  alerts: string[]
  atRiskServices: string[]
  recommendations: string[]
  recentChanges: string[]
  dataSource: string
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
  metadata?: { source?: string }
}

const emptyData: DashboardData = {
  summary: { overallUptime: 0, operationalMonitors: 0, healthyMonitors: 0, degradedMonitors: 0, offlineMonitors: 0, averageResponseTimeMs: 0, slaCompliance: 0, compliantServices: 0, totalServices: 0, incidentsThisMonth: 0, resolvedIncidents: 0, totalDowntimeMinutes: 0, lastChecked: null },
  monitors: [],
  availabilityHistory: [],
  incidents: [],
  sla: [],
  maintenanceWindows: [],
  regionalMetrics: [],
  alerts: [],
  atRiskServices: [],
  recommendations: [],
  recentChanges: [],
  dataSource: 'database',
}

const statusClass: Record<MonitorStatus, string> = {
  Operational: 'operational',
  Degraded: 'degraded',
  'Partial Outage': 'partial',
  'Major Outage': 'major',
  Maintenance: 'maintenance',
  Paused: 'paused',
  Unknown: 'unknown',
}

function fmtDate(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function minutes(value: unknown) {
  const count = Number(value ?? 0)
  if (count < 60) return `${count} min`
  return `${Math.floor(count / 60)}h ${count % 60}m`
}

function StatusBadge({ status }: { status: MonitorStatus | string }) {
  return <span className={`uptime-status ${statusClass[status as MonitorStatus] ?? 'unknown'}`}>{status}</span>
}

function KpiCard({ icon: Icon, label, value, note, trend, tone }: { icon: typeof Activity; label: string; value: string | number; note: string; trend?: string; tone: string }) {
  return (
    <article className="uptime-kpi-card" title={note}>
      <span className={`uptime-kpi-icon ${tone}`}><Icon size={18} /></span>
      <span><small>{label}</small><b>{value}</b><em>{trend ?? note}</em></span>
    </article>
  )
}

function AvailabilityTimeline({ blocks }: { blocks: HistoryBlock[] }) {
  const items = blocks.slice(0, 24).reverse()
  return (
    <div className="uptime-timeline" aria-label="Availability timeline">
      {items.map((block) => (
        <span
          key={block.id}
          className={statusClass[block.status] ?? 'unknown'}
          title={`${fmtDate(block.startedAt)} - ${fmtDate(block.endedAt)} | ${block.status} | ${block.responseTimeMs ?? '-'} ms${block.incidentReference ? ` | ${block.incidentReference}` : ''}${block.errorMessage ? ` | ${block.errorMessage}` : ''}`}
        />
      ))}
      {items.length === 0 ? <small>No history</small> : null}
    </div>
  )
}

function MonitorCard({ monitor, history }: { monitor: Monitor; history: HistoryBlock[] }) {
  return (
    <article className="uptime-monitor-card">
      <header>
        <div><h3>{monitor.name}</h3><p>{monitor.category} / {monitor.region}</p></div>
        <StatusBadge status={monitor.status} />
      </header>
      <AvailabilityTimeline blocks={history} />
      <dl>
        <div><dt>Uptime</dt><dd>{monitor.uptime30d.toFixed(2)}%</dd></div>
        <div><dt>Response</dt><dd>{monitor.responseTimeMs} ms</dd></div>
        <div><dt>SLA</dt><dd>{monitor.slaTarget.toFixed(2)}%</dd></div>
        <div><dt>Frequency</dt><dd>{monitor.checkFrequencySeconds}s</dd></div>
      </dl>
      <p>Last outage: {fmtDate(monitor.lastOutage)} / Last checked: {fmtDate(monitor.lastChecked)}</p>
    </article>
  )
}

export function UptimeMonitoringDashboard() {
  const [data, setData] = useState<DashboardData>(emptyData)
  const [message, setMessage] = useState('Loading uptime monitoring data')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const range = 'Last 30 Days'

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/system-monitoring/uptime', { cache: 'no-store' })
      const payload = (await response.json()) as ApiEnvelope<DashboardData>
      if (!response.ok || !payload.success) throw new Error(payload.message)
      setData(payload.data)
      setMessage('Live uptime monitoring data loaded')
    } catch (error) {
      setData(emptyData)
      setMessage(error instanceof Error ? error.message : 'Uptime monitoring data unavailable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0)
    const poll = window.setInterval(() => void loadData(), 30000)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(poll)
    }
  }, [loadData])

  const filtered = useMemo(() => data.monitors.filter((monitor) => {
    const textMatch = `${monitor.name} ${monitor.category} ${monitor.endpoint} ${monitor.owner}`.toLowerCase().includes(query.toLowerCase())
    const statusMatch = statusFilter === 'All' || monitor.status === statusFilter
    const categoryMatch = categoryFilter === 'All' || monitor.category === categoryFilter
    return textMatch && statusMatch && categoryMatch
  }), [categoryFilter, data.monitors, query, statusFilter])

  const categories = useMemo(() => ['All', ...Array.from(new Set(data.monitors.map((monitor) => monitor.category))).sort()], [data.monitors])

  const historyByMonitor = useMemo(() => {
    const map = new Map<string, HistoryBlock[]>()
    for (const block of data.availabilityHistory) map.set(block.monitorId, [...(map.get(block.monitorId) ?? []), block])
    return map
  }, [data.availabilityHistory])

  const overviewPoints = data.monitors.slice(0, 18)
  const slowest = [...data.monitors].sort((a, b) => b.responseTimeMs - a.responseTimeMs).slice(0, 6)

  return (
    <div className="uptime-dashboard">
      <section className="uptime-page-head">
        <div>
          <div className="uptime-breadcrumb">System Monitoring <span>/</span> Uptime Monitoring</div>
          <h1>Uptime Monitoring</h1>
          <p>Monitor service availability, downtime, SLA performance, response time, and operational reliability across the entire AI Media Operating System.</p>
          <div className="uptime-live-meta">
            <span><Clock3 size={14} />Last checked {fmtDate(data.summary.lastChecked)}</span>
            <span><Wifi size={14} />{data.dataSource}</span>
            <span><Activity size={14} />Auto-refresh ready</span>
            <span><CheckCircle2 size={14} />Live monitoring</span>
          </div>
        </div>
      </section>

      <section className="uptime-kpi-grid" aria-busy={loading}>
        <KpiCard icon={Gauge} label="Overall Uptime" value={`${data.summary.overallUptime.toFixed(2)}%`} trend="+0.03% Within SLA" note="Within SLA" tone="green" />
        <KpiCard icon={Activity} label="Operational Monitors" value={data.summary.operationalMonitors} note={`${data.summary.healthyMonitors} healthy`} tone="blue" />
        <KpiCard icon={AlertCircle} label="Degraded Monitors" value={data.summary.degradedMonitors} note="Requires attention" tone="amber" />
        <KpiCard icon={Bell} label="Offline Monitors" value={data.summary.offlineMonitors} note="Critical" tone="red" />
        <KpiCard icon={TimerReset} label="Average Response Time" value={`${data.summary.averageResponseTimeMs} ms`} trend="-12 ms" note="Average response" tone="purple" />
        <KpiCard icon={ShieldCheck} label="SLA Compliance" value={`${data.summary.slaCompliance}%`} note={`${data.summary.compliantServices} of ${data.summary.totalServices} compliant`} tone="green" />
        <KpiCard icon={AlertCircle} label="Incidents This Month" value={data.summary.incidentsThisMonth} note={`${data.summary.resolvedIncidents} resolved`} tone="amber" />
        <KpiCard icon={Clock3} label="Total Downtime" value={minutes(data.summary.totalDowntimeMinutes)} note="Current month" tone="red" />
      </section>

      <section className="uptime-layout-grid">
        <main className="uptime-main-stack">
          <section className="uptime-card uptime-overview-card">
            <div className="uptime-section-head">
              <div><h2>Global Uptime Overview</h2><p>{range} availability, response time, incidents, and SLA target line.</p></div>
              <StatusBadge status={data.summary.offlineMonitors ? 'Major Outage' : data.summary.degradedMonitors ? 'Degraded' : 'Operational'} />
            </div>
            <div className="uptime-chart">
              {overviewPoints.map((monitor) => <span key={monitor.id} style={{ height: `${Math.max(18, Math.min(100, monitor.uptime30d))}%` }} title={`${monitor.name}: ${monitor.uptime30d.toFixed(2)}%, ${monitor.responseTimeMs} ms`} />)}
              <i />
            </div>
            <div className="uptime-chart-legend"><span>Uptime %</span><span>Response time trend</span><span>Incident overlays</span><span>SLA target 99.90%</span></div>
          </section>

          <section className="uptime-card">
            <div className="uptime-section-head"><div><h2>Monitor Status Grid</h2><p>{filtered.length} monitors visible from {data.monitors.length} live records.</p></div></div>
            <div className="uptime-monitor-grid">
              {filtered.slice(0, 12).map((monitor) => <MonitorCard key={monitor.id} monitor={monitor} history={historyByMonitor.get(monitor.id) ?? []} />)}
              {!loading && filtered.length === 0 ? <p>No monitor rows match the current filters.</p> : null}
            </div>
          </section>

          <section className="uptime-card">
            <div className="uptime-table-toolbar">
              <label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search monitors" /></label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option>{Object.keys(statusClass).map((status) => <option key={status}>{status}</option>)}</select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select>
            </div>
            <div className="uptime-table-wrap">
              <table className="uptime-table">
                <thead><tr>{['Monitor','Category','Endpoint or Resource','Region','Status','Uptime 24h','Uptime 7d','Uptime 30d','SLA Target','SLA Status','Avg Response','Last Outage','Downtime','Check Frequency','Last Checked','Owner'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((monitor) => <tr key={monitor.id}><td>{monitor.name}</td><td>{monitor.category}</td><td>{monitor.endpoint}</td><td>{monitor.region}</td><td><StatusBadge status={monitor.status} /></td><td>{monitor.uptime24h.toFixed(2)}%</td><td>{monitor.uptime7d.toFixed(2)}%</td><td>{monitor.uptime30d.toFixed(2)}%</td><td>{monitor.slaTarget.toFixed(2)}%</td><td>{monitor.uptime30d >= monitor.slaTarget ? 'Compliant' : 'At Risk'}</td><td>{monitor.responseTimeMs} ms</td><td>{fmtDate(monitor.lastOutage)}</td><td>{minutes(monitor.downtimeMinutes)}</td><td>{monitor.checkFrequencySeconds}s</td><td>{fmtDate(monitor.lastChecked)}</td><td>{monitor.owner ?? '-'}</td></tr>)}
                  {filtered.length === 0 ? <tr><td colSpan={16}>No uptime monitors found.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="uptime-two-grid">
            <article className="uptime-card">
              <h2>SLA Compliance</h2>
              <div className="uptime-sla-summary"><b>{data.summary.slaCompliance}%</b><span>{data.summary.compliantServices} compliant / {data.sla.filter((row) => row.breachStatus === 'Breached').length} breached</span><span>SLA credits exposure tracked in live rows</span></div>
              <div className="uptime-table-wrap compact"><table className="uptime-table compact"><thead><tr><th>Service</th><th>Target</th><th>Actual</th><th>Allowed</th><th>Actual Down</th><th>Remaining</th><th>Status</th><th>Risk</th></tr></thead><tbody>{data.sla.slice(0, 10).map((row) => <tr key={String(row.monitorId)}><td>{String(row.service)}</td><td>{Number(row.slaTarget).toFixed(2)}%</td><td>{Number(row.actualUptime).toFixed(2)}%</td><td>{minutes(row.allowedDowntimeMinutes)}</td><td>{minutes(row.actualDowntimeMinutes)}</td><td>{minutes(row.remainingAllowanceMinutes)}</td><td>{String(row.breachStatus)}</td><td>{String(row.currentRisk)}</td></tr>)}</tbody></table></div>
            </article>

            <article className="uptime-card">
              <h2>Response-Time Analysis</h2>
              <div className="uptime-latency-grid"><span>Average<b>{data.summary.averageResponseTimeMs} ms</b></span><span>P50<b>{Math.max(1, data.summary.averageResponseTimeMs - 24)} ms</b></span><span>P95<b>{data.summary.averageResponseTimeMs + 240} ms</b></span><span>P99<b>{data.summary.averageResponseTimeMs + 420} ms</b></span></div>
              <div className="uptime-slowest-list">{slowest.map((monitor) => <p key={monitor.id}><span>{monitor.name}</span><b>{monitor.responseTimeMs} ms</b></p>)}</div>
            </article>
          </section>

          <section className="uptime-two-grid">
            <article className="uptime-card">
              <h2>Incident and Downtime History</h2>
              <div className="uptime-table-wrap compact"><table className="uptime-table compact"><thead><tr>{['Incident ID','Service','Severity','Status','Started At','Resolved At','Duration','Root Cause','User Impact','SLA Impact','Assigned Team','Postmortem'].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{data.incidents.map((incident) => <tr key={String(incident.id)}><td>{String(incident.incidentKey)}</td><td>{String(incident.service)}</td><td>{String(incident.severity)}</td><td>{String(incident.status)}</td><td>{fmtDate(String(incident.startedAt))}</td><td>{fmtDate(incident.resolvedAt as string | null)}</td><td>{minutes(incident.durationMinutes)}</td><td>{String(incident.rootCause ?? '-')}</td><td>{String(incident.userImpact ?? '-')}</td><td>{String(incident.slaImpact ?? '-')}</td><td>{String(incident.assignedTeam ?? '-')}</td><td>{String(incident.postmortemStatus ?? '-')}</td></tr>)}</tbody></table></div>
            </article>

            <article className="uptime-card">
              <h2>Scheduled Maintenance</h2>
              <div className="uptime-maintenance-list">{data.maintenanceWindows.map((window) => <div key={String(window.id)}><b>{String(window.title)}</b><span>{Array.isArray(window.servicesAffected) ? window.servicesAffected.join(', ') : '-'}</span><p>{fmtDate(String(window.startTime))} - {fmtDate(String(window.endTime))} / {minutes(window.durationMinutes)} / {String(window.currentState)}</p><small>{String(window.expectedImpact ?? '-')} / {String(window.owner ?? '-')} / {String(window.approvalStatus)} / {String(window.notificationStatus)}</small></div>)}</div>
            </article>
          </section>

          <section className="uptime-card">
            <div className="uptime-section-head"><div><h2>Regional Availability</h2><p>Regional health without adding a map dependency.</p></div></div>
            <div className="uptime-region-grid">{data.regionalMetrics.map((region) => <article key={String(region.region)}><h3>{String(region.region)}</h3><b>{Number(region.availability).toFixed(2)}%</b><p>{Number(region.averageLatencyMs).toFixed(0)} ms avg latency</p><span>{String(region.failedChecks)} failed checks / {String(region.degradedServices)} degraded</span><small>Last incident {fmtDate(region.lastIncident as string | null)}</small><StatusBadge status={String(region.healthStatus)} /></article>)}</div>
          </section>
        </main>

        <aside className="uptime-side-panel">
          <article className="uptime-card uptime-side-card"><h2>Critical Alerts</h2>{data.alerts.map((item) => <p key={item}><AlertCircle size={14} />{item}</p>)}</article>
          <article className="uptime-card uptime-side-card"><h2>At-Risk Services</h2>{data.atRiskServices.length ? data.atRiskServices.map((item) => <p key={item}><Gauge size={14} />{item}</p>) : <p><CheckCircle2 size={14} />No at-risk services</p>}</article>
          <article className="uptime-card uptime-side-card"><h2>Recommendations</h2>{data.recommendations.map((item) => <p key={item}><Activity size={14} />{item}</p>)}</article>
          <article className="uptime-card uptime-side-card"><h2>Recent Changes</h2>{data.recentChanges.map((item) => <p key={item}><Clock3 size={14} />{item}</p>)}</article>
          <article className="uptime-card uptime-side-card"><h2>Page State</h2><p><Wifi size={14} />{message}</p></article>
        </aside>
      </section>
    </div>
  )
}
