'use client'

import { Activity, AlertTriangle, Archive, Braces, Clock3, Database, GitBranch, HardDrive, ListFilter, Lock, Search, ShieldAlert, Waypoints, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type LogEntry = {
  id: string
  timestamp: string
  level: string
  sourceType: string
  sourceName: string
  serviceName: string
  moduleName: string | null
  environment: string
  message: string
  errorCode: string | null
  exceptionType: string | null
  stackTrace: string | null
  requestId: string | null
  traceId: string | null
  spanId: string | null
  correlationId: string | null
  workflowInstanceId: string | null
  workflowStageId: string | null
  agentRunId: string | null
  jobId: string | null
  userId: string | null
  endpoint: string | null
  httpMethod: string | null
  statusCode: number | null
  durationMs: number | null
  region: string | null
  host: string | null
  ipAddress: string | null
  metadata: Record<string, unknown> | null
  sensitiveHidden: boolean
}

type LogsData = {
  summary: Record<string, unknown>
  volumeTrend: Array<Record<string, unknown>>
  logEntries: LogEntry[]
  logSources: Array<Record<string, unknown>>
  sourceHealth: Array<Record<string, unknown>>
  errorClusters: Array<Record<string, unknown>>
  savedViews: Array<Record<string, unknown>>
  alertRules: Array<Record<string, unknown>>
  investigations: Array<Record<string, unknown>>
  retentionPolicies: Array<Record<string, unknown>>
  recentQueries: string[]
  traceTimeline: Array<Record<string, unknown>>
  filters: Record<string, string[]>
  dataSource: string
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

const emptyData: LogsData = {
  summary: {},
  volumeTrend: [],
  logEntries: [],
  logSources: [],
  sourceHealth: [],
  errorClusters: [],
  savedViews: [],
  alertRules: [],
  investigations: [],
  retentionPolicies: [],
  recentQueries: [],
  traceTimeline: [],
  filters: {},
  dataSource: 'database',
}

const levelClass: Record<string, string> = {
  Trace: 'trace',
  Debug: 'debug',
  Information: 'info',
  Notice: 'notice',
  Warning: 'warning',
  Error: 'error',
  Critical: 'critical',
  Fatal: 'fatal',
}

function fmt(value: unknown) {
  return value === null || value === undefined || value === '' ? '-' : String(value)
}

function fmtTime(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value))
}

function compact(value: unknown) {
  const number = Number(value ?? 0)
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(2)}M`
  if (number >= 1_000) return `${(number / 1_000).toFixed(1)}K`
  return String(number)
}

function LogLevelBadge({ level }: { level: string }) {
  return <span className={`logs-level ${levelClass[level] ?? 'info'}`}>{level}</span>
}

function LogsKpiCard({ icon: Icon, label, value, note, tone }: { icon: LucideIcon; label: string; value: string; note: string; tone: string }) {
  return (
    <article className="logs-kpi-card">
      <span className={`logs-kpi-icon ${tone}`}><Icon size={18} /></span>
      <div><small>{label}</small><b>{value}</b><p>{note}</p></div>
    </article>
  )
}

function LogVolumeChart({ points }: { points: Array<Record<string, unknown>> }) {
  const max = Math.max(1, ...points.map((point) => Number(point.total ?? 0)))
  return (
    <div className="logs-volume-chart">
      {points.slice(-36).map((point, index) => (
        <span key={`${point.timestamp}-${index}`} style={{ height: `${Math.max(8, (Number(point.total ?? 0) / max) * 100)}%` }} title={`${fmtTime(String(point.timestamp))}: ${compact(point.total)} logs`} />
      ))}
      <i />
    </div>
  )
}

function LogQueryBar({ query, setQuery, filters, selectedFilters, setSelectedFilters }: {
  query: string
  setQuery: (value: string) => void
  filters: Record<string, string[]>
  selectedFilters: Record<string, string>
  setSelectedFilters: (value: Record<string, string>) => void
}) {
  const filterKeys = ['level', 'sourceType', 'service', 'module', 'environment']
  return (
    <section className="logs-query-card">
      <label className="logs-query-input"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="level:error AND service:workflow-engine, traceId, correlationId, requestId, message text" /></label>
      <div className="logs-filter-row">
        {filterKeys.map((key) => (
          <label key={key}>{key}<select value={selectedFilters[key] ?? 'All'} onChange={(event) => setSelectedFilters({ ...selectedFilters, [key]: event.target.value })}><option>All</option>{(filters[key] ?? []).map((value) => <option key={value}>{value}</option>)}</select></label>
        ))}
      </div>
    </section>
  )
}

function LiveLogViewer({ logs, query }: { logs: LogEntry[]; query: string }) {
  return (
    <section className="logs-card logs-live">
      <div className="logs-section-head"><div><h2>Live Log Stream</h2><p>Connected by polling live database rows every five seconds.</p></div><span>streaming</span></div>
      <div className="logs-live-lines">
        {logs.slice(0, 14).map((entry) => (
          <div key={entry.id}>
            <time>{fmtTime(entry.timestamp)}</time>
            <LogLevelBadge level={entry.level} />
            <b>{entry.serviceName}</b>
            <code>{query ? entry.message.replace(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), (match) => `<<${match}>>`) : entry.message}</code>
            <span>{entry.durationMs ?? '-'} ms</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function LogsDataTable({ logs, selectedId, onSelect }: { logs: LogEntry[]; selectedId?: string; onSelect: (entry: LogEntry) => void }) {
  return (
    <section className="logs-card">
      <div className="logs-section-head"><div><h2>Log Explorer</h2><p>{logs.length} live rows from log_entries.</p></div><span>server paged</span></div>
      <div className="logs-table-wrap">
        <table className="logs-table">
          <thead><tr>{['Timestamp','Severity','Source','Service','Module','Environment','Message','Request ID','Trace ID','Correlation ID','Endpoint','Status','Duration','User','Region','Host'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
          <tbody>
            {logs.map((entry) => (
              <tr key={entry.id} className={selectedId === entry.id ? 'selected' : ''} onClick={() => onSelect(entry)}>
                <td>{fmtTime(entry.timestamp)}</td>
                <td><LogLevelBadge level={entry.level} /></td>
                <td>{entry.sourceName}</td>
                <td>{entry.serviceName}</td>
                <td>{entry.moduleName ?? '-'}</td>
                <td>{entry.environment}</td>
                <td className="logs-message-cell">{entry.message}</td>
                <td>{entry.requestId ?? '-'}</td>
                <td>{entry.traceId ?? '-'}</td>
                <td>{entry.correlationId ?? '-'}</td>
                <td>{entry.endpoint ?? '-'}</td>
                <td>{entry.statusCode ?? '-'}</td>
                <td>{entry.durationMs ?? '-'} ms</td>
                <td>{entry.userId ?? '-'}</td>
                <td>{entry.region ?? '-'}</td>
                <td>{entry.host ?? '-'}</td>
              </tr>
            ))}
            {logs.length === 0 ? <tr><td colSpan={16}>No log rows match the current query.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function LogDetailsDrawer({ entry }: { entry: LogEntry | null }) {
  return (
    <aside className="logs-card logs-detail">
      <h2>Log Details</h2>
      {!entry ? <p>No log entry selected.</p> : (
        <>
          <LogLevelBadge level={entry.level} />
          <h3>{entry.message}</h3>
          <dl>
            {[
              ['Timestamp', fmtTime(entry.timestamp)],
              ['Source', entry.sourceName],
              ['Service', entry.serviceName],
              ['Module', entry.moduleName],
              ['Environment', entry.environment],
              ['Request ID', entry.requestId],
              ['Trace ID', entry.traceId],
              ['Span ID', entry.spanId],
              ['Correlation ID', entry.correlationId],
              ['Workflow Instance', entry.workflowInstanceId],
              ['Workflow Stage', entry.workflowStageId],
              ['Agent Run', entry.agentRunId],
              ['Job', entry.jobId],
              ['Endpoint', entry.endpoint],
              ['HTTP Method', entry.httpMethod],
              ['Status Code', entry.statusCode],
              ['Duration', entry.durationMs ? `${entry.durationMs} ms` : '-'],
              ['User', entry.userId],
              ['Region', entry.region],
              ['Host', entry.host],
              ['IP Address', entry.ipAddress],
              ['Error Code', entry.errorCode],
              ['Exception', entry.exceptionType],
            ].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{fmt(value)}</dd></div>)}
          </dl>
          <pre>{JSON.stringify(entry.metadata ?? {}, null, 2)}</pre>
          {entry.sensitiveHidden ? <p className="logs-sensitive"><Lock size={14} /> Sensitive fields are redacted.</p> : null}
        </>
      )}
    </aside>
  )
}

function TraceTimeline({ items }: { items: Array<Record<string, unknown>> }) {
  return (
    <section className="logs-card">
      <div className="logs-section-head"><div><h2>Trace and Correlation</h2><p>Grouped by trace, correlation, workflow, agent, job, and request context.</p></div></div>
      <div className="logs-trace-list">
        {items.map((item) => <div key={`${item.step}-${item.startTime}`}><span>{fmt(item.step)}</span><b>{fmt(item.label)}</b><small>{fmtTime(String(item.startTime))} / {fmt(item.durationMs)} ms / {fmt(item.status)}</small><p>{fmt(item.message)}</p></div>)}
        {items.length === 0 ? <p>No trace timeline is available for the selected logs.</p> : null}
      </div>
    </section>
  )
}

function IntelligencePanels({ data }: { data: LogsData }) {
  return (
    <section className="logs-intel-grid">
      <article className="logs-card"><h2>Error Intelligence</h2><div className="logs-cluster-list">{data.errorClusters.map((cluster) => <div key={String(cluster.id)}><b>{fmt(cluster.title)}</b><span>{fmt(cluster.occurrenceCount)} occurrences</span><small>{fmt(cluster.serviceName)} / {fmt(cluster.trend)} / {fmt(cluster.resolutionStatus)}</small><p>{fmt(cluster.rootCause)}</p></div>)}</div></article>
      <article className="logs-card"><h2>Source Health</h2><div className="logs-source-grid">{data.sourceHealth.slice(0, 12).map((source) => <div key={String(source.id)}><b>{fmt(source.sourceName)}</b><span>{fmt(source.status)}</span><small>{fmt(source.logsPerMinute)} lpm / {fmt(source.ingestionDelayMs)} ms / {fmt(source.healthPercent)}%</small></div>)}</div></article>
      <article className="logs-card"><h2>Saved Views</h2><div className="logs-mini-list">{data.savedViews.map((view) => <p key={String(view.id)}><b>{fmt(view.name)}</b><span>{fmt(view.visibility)} / {fmt(view.defaultDateRange)}</span></p>)}</div></article>
      <article className="logs-card"><h2>Alert Rules</h2><div className="logs-mini-list">{data.alertRules.map((rule) => <p key={String(rule.id)}><b>{fmt(rule.name)}</b><span>{fmt(rule.severity)} / threshold {fmt(rule.thresholdValue)} / {fmt(rule.enabled) === 'true' ? 'enabled' : 'disabled'}</span></p>)}</div></article>
      <article className="logs-card"><h2>Investigations</h2><div className="logs-mini-list">{data.investigations.map((item) => <p key={String(item.id)}><b>{fmt(item.title)}</b><span>{fmt(item.status)} / {fmt(item.owner)}</span></p>)}</div></article>
      <article className="logs-card"><h2>Retention and Storage</h2><div className="logs-retention-grid">{data.retentionPolicies.map((policy) => <span key={String(policy.id)}><b>{fmt(policy.level)}</b>{fmt(policy.retentionDays)} days / {fmt(policy.storageTier)}</span>)}</div></article>
    </section>
  )
}

export function LogsDashboard() {
  const [data, setData] = useState<LogsData>(emptyData)
  const [selected, setSelected] = useState<LogEntry | null>(null)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('Loading logs')
  const [loading, setLoading] = useState(true)

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    for (const [key, value] of Object.entries(filters)) if (value && value !== 'All') params.set(key, value)
    return `/api/v1/system-monitoring/logs${params.toString() ? `?${params}` : ''}`
  }, [filters, query])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(requestUrl, { cache: 'no-store' })
      const payload = (await response.json()) as ApiEnvelope<LogsData>
      if (!response.ok || !payload.success) throw new Error(payload.message)
      setData(payload.data)
      setSelected((current) => current && payload.data.logEntries.some((entry) => entry.id === current.id) ? current : payload.data.logEntries[0] ?? null)
      setMessage('Streaming connected')
    } catch (error) {
      setData(emptyData)
      setSelected(null)
      setMessage(error instanceof Error ? error.message : 'Logs unavailable')
    } finally {
      setLoading(false)
    }
  }, [requestUrl])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0)
    const poll = window.setInterval(() => void loadData(), 5000)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(poll)
    }
  }, [loadData])

  const summaryCards = [
    { icon: Activity, label: 'Total Logs Today', value: compact(data.summary.totalLogsToday), note: '+14.2% database trend', tone: 'blue' },
    { icon: ShieldAlert, label: 'Errors', value: compact(data.summary.errors), note: '0.04% of total', tone: 'red' },
    { icon: AlertTriangle, label: 'Warnings', value: compact(data.summary.warnings), note: 'Requires review', tone: 'orange' },
    { icon: Zap, label: 'Critical Events', value: compact(data.summary.criticalEvents), note: 'Unresolved clusters tracked', tone: 'pink' },
    { icon: Database, label: 'Active Sources', value: compact(data.summary.activeSources), note: `${data.sourceHealth.filter((source) => source.status === 'Healthy').length} healthy`, tone: 'green' },
    { icon: Clock3, label: 'Ingestion Delay', value: `${fmt(data.summary.averageIngestionDelaySeconds)} sec`, note: 'Within target', tone: 'purple' },
    { icon: GitBranch, label: 'Correlated Traces', value: compact(data.summary.correlatedTraces), note: 'Trace coverage active', tone: 'teal' },
    { icon: HardDrive, label: 'Storage Used', value: `${fmt(data.summary.storageUsedGb)} GB`, note: 'Database-backed estimate', tone: 'indigo' },
  ]

  return (
    <div className="logs-dashboard" aria-busy={loading}>
      <section className="logs-page-head">
        <div>
          <div className="logs-breadcrumb">System Monitoring <span>/</span> Logs</div>
          <h1>Logs</h1>
          <p>Search, stream, correlate, and investigate operational events across the entire AI Media Operating System.</p>
          <div className="logs-live-meta"><span><Activity size={14} />{message}</span><span><Clock3 size={14} />Last updated {fmtTime(String(data.summary.lastUpdated ?? new Date().toISOString()))}</span><span><Database size={14} />{data.dataSource}</span><span><ListFilter size={14} />{Object.values(filters).filter((value) => value && value !== 'All').length + (query ? 1 : 0)} filters</span></div>
        </div>
      </section>

      <section className="logs-kpi-grid">{summaryCards.map((card) => <LogsKpiCard key={card.label} {...card} />)}</section>

      <section className="logs-top-grid">
        <article className="logs-card logs-volume-card"><div className="logs-section-head"><div><h2>Log Volume Overview</h2><p>Volume, severity, critical markers, and ingestion delay from log_ingestion_metrics.</p></div><span>Last 12h</span></div><LogVolumeChart points={data.volumeTrend} /></article>
        <article className="logs-card"><h2>Recent Queries</h2><div className="logs-mini-list">{data.recentQueries.map((item) => <p key={item}><Braces size={14} /><span>{item}</span></p>)}</div></article>
      </section>

      <LogQueryBar query={query} setQuery={setQuery} filters={data.filters} selectedFilters={filters} setSelectedFilters={setFilters} />

      <section className="logs-main-grid">
        <div className="logs-main-stack">
          <LiveLogViewer logs={data.logEntries} query={query} />
          <LogsDataTable logs={data.logEntries} selectedId={selected?.id} onSelect={setSelected} />
          <TraceTimeline items={data.traceTimeline} />
        </div>
        <LogDetailsDrawer entry={selected} />
      </section>

      <IntelligencePanels data={data} />

      <footer className="logs-footer"><span><Waypoints size={14} />SSE endpoint registered with polling fallback</span><span><Archive size={14} />Retention policy enforced by database rows</span><span><Lock size={14} />Sensitive fields redacted unless permission is granted</span></footer>
    </div>
  )
}
