'use client'

import { Activity, AlertTriangle, Bot, BriefcaseBusiness, Cpu, Database, GitBranch, Lock, RadioTower, RefreshCw, Search, ShieldCheck, Timer, Workflow } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Row = Record<string, unknown>
type Data = {
  headerIndicators: Row
  globalStatus: Row
  kpis: Row[]
  architectureMap: Row[]
  agentGrid: Row[]
  workflowBoard: Row[]
  queues: Row[]
  workers: Row[]
  toolCalls: Row[]
  modelRouting: Row[]
  memory: Row[]
  rag: Row[]
  publishing: Row[]
  socialMonitor: Row[]
  health: Row[]
  costs: Row[]
  latency: Row[]
  errorStream: Row[]
  incidents: Row[]
  recovery: Row[]
  security: Row[]
  governance: Row[]
  learning: Row[]
  business: Row[]
  notifications: Row[]
  timeline: Row[]
  commandCenter: Row[]
  digitalTwin: Row[]
  dataSource: string
  realtime: Row
}
type Envelope<T> = { success: boolean; message: string; data: T }

const emptyData: Data = {
  headerIndicators: {},
  globalStatus: {},
  kpis: [],
  architectureMap: [],
  agentGrid: [],
  workflowBoard: [],
  queues: [],
  workers: [],
  toolCalls: [],
  modelRouting: [],
  memory: [],
  rag: [],
  publishing: [],
  socialMonitor: [],
  health: [],
  costs: [],
  latency: [],
  errorStream: [],
  incidents: [],
  recovery: [],
  security: [],
  governance: [],
  learning: [],
  business: [],
  notifications: [],
  timeline: [],
  commandCenter: [],
  digitalTwin: [],
  dataSource: 'database',
  realtime: {},
}

const kpiIcons: LucideIcon[] = [Bot, Workflow, GitBranch, Cpu, ShieldCheck, AlertTriangle, RefreshCw, RadioTower, Timer, Database, BriefcaseBusiness, Lock]

function fmt(value: unknown) {
  return value === null || value === undefined || value === '' ? '-' : String(value)
}

function n(value: unknown) {
  return Number(value ?? 0)
}

function pct(value: unknown) {
  return `${n(value).toFixed(1)}%`
}

function slug(value: unknown) {
  return fmt(value).toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function clock(value: Date) {
  return new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }).format(value)
}

function Pill({ value }: { value: unknown }) {
  return <span className={`ops-pill ${slug(value)}`}>{fmt(value)}</span>
}

function Kpi({ item, icon: Icon }: { item: Row; icon: LucideIcon }) {
  return <article className={`ops-kpi ${slug(item.status)}`}><span><Icon size={18} /></span><div><small>{fmt(item.label)}</small><b>{fmt(item.value)}</b><p>{fmt(item.trend)}</p></div></article>
}

function StatusBar({ status }: { status: Row }) {
  const items: Array<[string, unknown]> = [['System Status', status.systemStatus], ['Production', status.production], ['Running', status.running], ['Overall Health', pct(status.overallHealth)], ['AI Status', status.overallAiStatus], ['Publishing', status.publishing], ['Learning', status.learning], ['Security', status.security], ['Governance', status.governance], ['Business Readiness', status.businessReadiness]]
  return <section className="ops-status-bar">{items.map(([label, value]) => <div key={label}><span>{label}</span><b>{fmt(value)}</b></div>)}</section>
}

function SystemMap({ rows }: { rows: Row[] }) {
  return <section className="ops-card ops-map-card"><div className="ops-section-head"><div><h2>Live System Map</h2><p>End-to-end autonomous flow across workflows, agents, prompts, models, providers, tools, memory, RAG, publishing, analytics, learning, and business outcomes.</p></div><Pill value="live" /></div><div className="ops-map">{rows.map((row, index) => <article key={fmt(row.name)}><small>{index + 1}</small><h3>{fmt(row.name)}</h3><strong>{pct(row.healthPercent)}</strong><p>{fmt(row.status)} / queue {fmt(row.queue)} / errors {fmt(row.errors)}</p><i style={{ width: `${Math.min(100, Math.max(0, n(row.healthPercent)))}%` }} /></article>)}</div></section>
}

function AgentGrid({ rows }: { rows: Row[] }) {
  return <section className="ops-card"><div className="ops-section-head"><div><h2>Live Agent Grid</h2><p>{rows.length} agents loaded from the live agent registry and active run tables.</p></div><span>inspect-only</span></div><div className="ops-agent-grid">{rows.map((row) => <article key={fmt(row.id)}><div><h3>{fmt(row.name)}</h3><Pill value={row.status} /></div><dl><div><dt>Domain</dt><dd>{fmt(row.domain)}</dd></div><div><dt>Running</dt><dd>{fmt(row.runningRuns)}</dd></div><div><dt>Confidence</dt><dd>{pct(row.avgConfidence)}</dd></div><div><dt>Queue</dt><dd>{fmt(row.queueName)}</dd></div><div><dt>Worker</dt><dd>{fmt(row.workerId)}</dd></div><div><dt>Latency</dt><dd>{Math.round(n(row.avgLatencyMs))} ms</dd></div><div><dt>Cost</dt><dd>${n(row.totalCost).toFixed(2)}</dd></div></dl><footer>Inspect / Logs available through active run detail routes</footer></article>)}</div></section>
}

function WorkflowBoard({ rows }: { rows: Row[] }) {
  return <section className="ops-card"><div className="ops-section-head"><div><h2>Workflow Execution Board</h2><p>Pipeline stage activity from workflow runtime views.</p></div></div><div className="ops-workflow-board">{rows.map((row, index) => <article key={`${fmt(row.stageName ?? row.stage)}-${index}`}><span>{index + 1}</span><h3>{fmt(row.stageName ?? row.stage)}</h3><b>{fmt(row.activeInstances ?? row.activeRunCount ?? 0)} active</b><p>{fmt(row.completedToday ?? row.completedCount ?? 0)} completed / {fmt(row.failed ?? row.failedCount ?? 0)} failed</p></article>)}</div></section>
}

function TablePanel({ title, rows, fields, note }: { title: string; rows: Row[]; fields: Array<[string, string]>; note?: string }) {
  return <section className="ops-card"><div className="ops-section-head"><div><h2>{title}</h2><p>{note ?? `${rows.length} live database rows`}</p></div></div>{rows.length ? <div className="ops-panel-list">{rows.slice(0, 10).map((row, index) => <article key={fmt(row.id ?? row.runId ?? row.workerId ?? row.queueName ?? index)}>{fields.map(([label, key]) => <p key={key}><span>{label}</span><b>{fmt(row[key])}</b></p>)}</article>)}</div> : <div className="ops-empty">No live rows for this panel.</div>}</section>
}

function HealthPanel({ rows }: { rows: Row[] }) {
  return <section className="ops-card"><div className="ops-section-head"><div><h2>AI Health</h2><p>Health dimensions are calculated from runtime tables and operational services.</p></div></div><div className="ops-health-grid">{rows.map((row) => <article key={fmt(row.name)}><span>{fmt(row.name)}</span><b>{pct(row.value)}</b><progress value={Math.max(0, Math.min(100, n(row.value)))} max={100} /></article>)}</div></section>
}

export function OperationsDashboard() {
  const [data, setData] = useState<Data>(emptyData)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState<Date | null>(() => new Date())
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/operations', { cache: 'no-store' })
      const payload = (await response.json()) as Envelope<Data>
      if (!response.ok || !payload.success) throw new Error(payload.message)
      setData(payload.data)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Agent Operations Center unavailable')
    }
  }, [])

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0)
    const poll = window.setInterval(() => void load(), 5000)
    return () => { window.clearTimeout(initial); window.clearInterval(poll) }
  }, [load])
  useEffect(() => { const interval = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(interval) }, [])

  const filteredAgents = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return data.agentGrid
    return data.agentGrid.filter((row) => [row.name, row.code, row.domain, row.status, row.queueName, row.workerId].some((value) => fmt(value).toLowerCase().includes(text)))
  }, [data.agentGrid, query])

  return <main className="ops-page"><header className="ops-header"><div><nav>AI Agents / Agent Operations Center</nav><h1>Agent Operations Center</h1><p>Real-time operational command center for the autonomous AI workforce.</p><div className="ops-meta"><span><RadioTower size={14} /> Operations Engine: {fmt(data.headerIndicators.operationsEngine)}</span><span><Bot size={14} /> Autonomous Status: {fmt(data.headerIndicators.autonomousStatus)}</span><span><ShieldCheck size={14} /> Production Health: {fmt(data.headerIndicators.productionHealth)}</span><span><Workflow size={14} /> Workflows: {fmt(data.headerIndicators.runningWorkflows)}</span><span><Cpu size={14} /> Workers: {fmt(data.headerIndicators.workers)}</span><span><GitBranch size={14} /> Queues: {fmt(data.headerIndicators.queues)}</span><span><Database size={14} /> {fmt(data.dataSource)}</span></div><div className="ops-actions">{['Emergency Stop','Resume Operations','Pause Workflows','Restart Workers','Open Incidents','Open Security Center','Open Governance','Export Operations Report'].map((item) => <span key={item}>{item}: governed</span>)}</div></div><div className="ops-clock">{now ? clock(now) : 'Loading Nigeria time'}</div></header>{error ? <div className="ops-error">{error}</div> : null}<StatusBar status={data.globalStatus} /><section className="ops-kpis">{data.kpis.map((item, index) => <Kpi key={fmt(item.label)} item={item} icon={kpiIcons[index] ?? Activity} />)}</section><section className="ops-query"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search live agents, queues, workers, status..." /></label><span><Activity size={14} /> Polling every {fmt(data.realtime.heartbeatSeconds ?? 5)} seconds</span></section><SystemMap rows={data.architectureMap} /><AgentGrid rows={filteredAgents} /><WorkflowBoard rows={data.workflowBoard} /><section className="ops-grid-two"><TablePanel title="Live Queues" rows={data.queues} fields={[['Queue', 'queueName'], ['Status', 'queueStatus'], ['Jobs', 'jobs'], ['Waiting', 'waiting'], ['Running', 'running'], ['Failed', 'failed']]} /><TablePanel title="Worker Pool" rows={data.workers} fields={[['Worker', 'workerId'], ['Queue', 'queueName'], ['Running Jobs', 'runningJobs'], ['Active Jobs', 'activeJobs'], ['Recovery', 'recoveryJobs'], ['Latency', 'latencyMs']]} /><TablePanel title="Live Tool Calls" rows={data.toolCalls} fields={[['Tool', 'toolName'], ['Agent', 'agentName'], ['Status', 'status'], ['Latency', 'durationMs'], ['Retries', 'retryCount'], ['Fallback', 'rateLimitStatus']]} /><TablePanel title="Live Model Routing" rows={data.modelRouting} fields={[['Agent', 'agentName'], ['Provider', 'selectedProvider'], ['Model', 'selectedModel'], ['Reason', 'routingReason'], ['Health', 'healthStatus'], ['Fallback', 'fallbackReadiness']]} /></section><section className="ops-grid-two"><TablePanel title="Live Memory" rows={data.memory} fields={[['Agent', 'agentName'], ['Working Memory', 'contextSize'], ['Limit', 'contextLimit'], ['Retrievals', 'retrievalSources'], ['Cache', 'duplicateContext'], ['Embedding', 'relevanceScore']]} /><TablePanel title="Live RAG" rows={data.rag} fields={[['Agent', 'agentName'], ['Sources', 'retrievalSources'], ['Grounding', 'provenanceScore'], ['Citation', 'provenanceScore'], ['Failures', 'staleContext'], ['Overflow', 'overflowRisk']]} /><TablePanel title="Live Publishing" rows={data.publishing} fields={[['Agent', 'agentName'], ['Validation', 'validationState'], ['Quality', 'qualityScore'], ['Readiness', 'finalOutputReadiness'], ['Schema', 'schemaValidation'], ['Policy', 'platformPolicyStatus']]} /><TablePanel title="Social Live Monitor" rows={data.socialMonitor} fields={[['Readiness', 'readinessPercent'], ['Workflow', 'workflowName'], ['Status', 'status'], ['Source', 'source']]} /></section><section className="ops-grid-two"><HealthPanel rows={data.health} /><TablePanel title="Cost Monitor" rows={data.costs} fields={[['Agent', 'agentName'], ['Domain', 'domain'], ['Estimated', 'estimatedCost'], ['Actual', 'actualCost'], ['Context Tokens', 'contextTokens'], ['Wasted', 'wastedTokens']]} /><TablePanel title="Latency Monitor" rows={data.latency} fields={[['Agent', 'agentName'], ['Workflow', 'workflowName'], ['Stage', 'workflowStage'], ['Elapsed', 'elapsedMinutes'], ['Provider', 'providerName'], ['Model', 'modelName']]} /><TablePanel title="Error Stream" rows={data.errorStream} fields={[['Time', 'createdAt'], ['Severity', 'severity'], ['Workflow', 'workflowName'], ['Message', 'message'], ['Status', 'status']]} /></section><section className="ops-grid-two"><TablePanel title="Incident Center" rows={data.incidents} fields={[['Incident', 'incidentCode'], ['Status', 'status'], ['Severity', 'severity'], ['Owner', 'ownerName'], ['Updated', 'updatedAt']]} /><TablePanel title="Recovery Engine" rows={data.recovery} fields={[['Agent', 'agentName'], ['Failure', 'failure'], ['Strategy', 'strategy'], ['Retries', 'attempt'], ['Progress', 'progressPercent'], ['Outcome', 'outcome']]} /><TablePanel title="Security Center" rows={data.security} fields={[['Event', 'eventType'], ['Status', 'status'], ['Severity', 'severity'], ['Risk', 'riskScore'], ['Time', 'createdAt']]} /><TablePanel title="Governance Status" rows={data.governance} fields={[['Decision', 'decision'], ['Policy', 'policyName'], ['Status', 'status'], ['Risk', 'riskLevel'], ['Time', 'createdAt']]} /></section><section className="ops-grid-two"><TablePanel title="Learning Status" rows={data.learning} fields={[['Signal', 'signalType'], ['Source', 'sourceName'], ['Status', 'status'], ['Confidence', 'confidence'], ['Time', 'createdAt']]} /><TablePanel title="Business Status" rows={data.business} fields={[['Metric', 'metricName'], ['Value', 'metricValue'], ['Impact', 'impact'], ['Status', 'status'], ['Updated', 'updatedAt']]} /><TablePanel title="Live Notifications" rows={data.notifications} fields={[['Time', 'createdAt'], ['Severity', 'severity'], ['Message', 'message'], ['Workflow', 'workflowName']]} /><TablePanel title="Command Center" rows={data.commandCenter} fields={[['Command', 'command'], ['Mode', 'mode'], ['API', 'api'], ['Status', 'status']]} /></section><section className="ops-grid-two"><TablePanel title="Timeline" rows={data.timeline} fields={[['Kind', 'kind'], ['Time', 'createdAt'], ['Event', 'eventType'], ['Message', 'message'], ['Status', 'status']]} /><TablePanel title="Digital Twin" rows={data.digitalTwin} fields={[['Action', 'action'], ['Route', 'route'], ['Status', 'status']]} /></section></main>
}
