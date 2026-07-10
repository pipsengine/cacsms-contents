'use client'

import { Activity, AlertTriangle, BrainCircuit, CheckCircle2, Clock3, Database, FileSearch, GitBranch, Radio, Search, ShieldCheck, Workflow, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Row = Record<string, unknown>
type Data = {
  summary: Row & { kpis?: Row[] }
  observabilityStatus: Row
  traceLifecycle: Row[]
  failurePath: Row[]
  eventStream: Row[]
  workflowEvents: Row[]
  traceExplorer: Row[]
  stageTimeline: Row[]
  transitionTrace: Row[]
  agentTrace: Row[]
  jobTrace: Row[]
  recoveryHistory: Row[]
  outputLineage: Row[]
  errorClusters: Row[]
  savedViews: Row[]
  alertRules: Row[]
  investigations: Row[]
  analytics: Row[]
  retention: Row[]
  traceCompleteness: Row[]
  filters: Record<string, string[]>
  queryExamples: string[]
  dataSource: string
  realtime: Row
}
type Envelope<T> = { success: boolean; message: string; data: T }
const emptyData: Data = { summary: {}, observabilityStatus: {}, traceLifecycle: [], failurePath: [], eventStream: [], workflowEvents: [], traceExplorer: [], stageTimeline: [], transitionTrace: [], agentTrace: [], jobTrace: [], recoveryHistory: [], outputLineage: [], errorClusters: [], savedViews: [], alertRules: [], investigations: [], analytics: [], retention: [], traceCompleteness: [], filters: {}, queryExamples: [], dataSource: 'database', realtime: {} }
const icons: LucideIcon[] = [FileSearch, Activity, AlertTriangle, Zap, ShieldCheck, BrainCircuit, CheckCircle2, Clock3, Radio, Workflow]
const filterKeys = ['level', 'eventType', 'workflow', 'workflowStatus', 'stage', 'queue', 'worker', 'agent', 'outputStatus', 'publishingStatus', 'analyticsStatus', 'learningStatus', 'environment', 'brand']

function fmt(value: unknown) { return value === null || value === undefined || value === '' ? '-' : String(value) }
function pct(value: unknown) { return `${Number(value ?? 0).toFixed(1)}%` }
function slug(value: unknown) { return fmt(value).toLowerCase().replace(/[^a-z0-9]+/g, '-') }
function time(value?: string | null) { return value ? new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value)) : '-' }
function fullClock(value: Date) { return new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }).format(value) }
function Pill({ value }: { value: unknown }) { return <span className={`wl-pill ${slug(value)}`}>{fmt(value)}</span> }

function Kpi({ item, icon: Icon, onFilter }: { item: Row; icon: LucideIcon; onFilter: () => void }) {
  return <article className={`wl-kpi ${slug(item.status)}`} onClick={onFilter} title={`${fmt(item.label)} / ${fmt(item.dataSource)}`}><span><Icon size={18} /></span><div><small>{fmt(item.label)}</small><b>{fmt(item.value)}</b><p>{fmt(item.trend)} / {fmt(item.status)}</p></div></article>
}

function ObservabilityStatus({ status }: { status: Row }) {
  const items: Array<[string, unknown]> = [['Workflow collector', status.workflowEventCollector], ['Stage collector', status.stageEventCollector], ['Transition logger', status.transitionLogger], ['AI collector', status.aiAgentEventCollector], ['Job logger', status.backgroundJobLogger], ['Approval logger', status.approvalLogger], ['Recovery logger', status.recoveryLogger], ['Publishing collector', status.publishingEventCollector], ['Analytics collector', status.analyticsEventCollector], ['Learning collector', status.learningEventCollector], ['Trace correlation', status.traceCorrelationEngine], ['Output lineage', status.outputLineageEngine], ['Retention', status.retentionEngine], ['Alert evaluation', status.alertEvaluationEngine], ['Events/sec', status.eventsPerSecond], ['Assembling traces', status.tracesBeingAssembled], ['Correlation', status.correlationCoverage], ['Ingestion delay', status.ingestionDelay], ['Dropped events', status.droppedEvents], ['Parsing failures', status.parsingFailures], ['Open trace gaps', status.openTraceGaps], ['Storage usage', status.storageUsage], ['Bottleneck', status.currentBottleneck], ['Human attention', status.humanAttentionRequired]]
  return <section className="wl-card"><div className="wl-section-head"><div><h2>Workflow Observability Status</h2><p>Collectors, trace correlation, lineage, retention, alert evaluation, and storage health from MSSQL-backed telemetry.</p></div><Pill value={status.operatingMode} /></div><div className="wl-status-grid">{items.map(([label, value]) => <div key={label}><span>{label}</span><b>{fmt(value)}</b></div>)}</div></section>
}

function Flow({ title, rows }: { title: string; rows: Row[] }) {
  return <section className="wl-card"><div className="wl-section-head"><div><h2>{title}</h2><p>Trace count, event volume, recovery count, average duration, correlation health, and missing-event count.</p></div></div><div className="wl-life">{rows.map((row) => <article key={fmt(row.name)}><h3>{fmt(row.name)}</h3><b>{fmt(row.eventCount)} events</b><p>{fmt(row.traceCount)} traces / {fmt(row.failureCount)} failures</p><small>{fmt(row.recoveryCount)} recoveries / {fmt(row.averageDurationMs)} ms / {pct(row.correlationHealth)}</small></article>)}</div></section>
}

function QueryPanel({ query, setQuery, selectedFilters, setSelectedFilters, data }: { query: string; setQuery: (value: string) => void; selectedFilters: Record<string, string>; setSelectedFilters: (value: Record<string, string>) => void; data: Data }) {
  return <section className="wl-card wl-query-card"><div className="wl-section-head"><div><h2>Structured Workflow Query</h2><p>Search trace IDs, workflow instances, stages, agents, jobs, outputs, incidents, correlation IDs, and redacted messages.</p></div><span>query-safe</span></div><div className="wl-query"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='workflowCode:"CONTENT_LIFECYCLE" AND status:failed' /></label><div>{filterKeys.map((key) => <label key={key}>{key}<select value={selectedFilters[key] ?? 'All'} onChange={(event) => setSelectedFilters({ ...selectedFilters, [key]: event.target.value })}><option>All</option>{(data.filters[key] ?? []).map((value) => <option key={value}>{value}</option>)}</select></label>)}</div></div><div className="wl-examples">{data.queryExamples.map((example) => <code key={example}>{example}</code>)}</div></section>
}

function LiveStream({ rows }: { rows: Row[] }) {
  return <section className="wl-card"><div className="wl-section-head"><div><h2>Live Workflow Event Stream</h2><p>Polling-backed live tail with redacted structured metadata and final-output indicators.</p></div><span>connected</span></div><div className="wl-stream">{rows.map((row) => <article key={fmt(row.id)}><time>{time(row.timestamp as string | null)}</time><Pill value={row.level} /><b>{fmt(row.workflowName)}</b><span>{fmt(row.stageCode)}</span><code>{fmt(row.eventType)} | {fmt(row.message)}</code><small>{fmt(row.status)} / trace {fmt(row.traceId)} / final {fmt(row.outputState)}</small></article>)}</div></section>
}

function EventsTable({ rows, selectedId, onSelect }: { rows: Row[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const heads = ['Timestamp','Severity','Event Type','Workflow','Version','Instance','Stage','Transition','Trigger','Action','Agent','Job','Queue','Worker','Status','Message','Duration','Retries','Recovery','Approval','Output','Publishing','Analytics','Learning','Incident','Trace','Correlation','Organization','Brand','State']
  return <section className="wl-card wl-table-card"><div className="wl-section-head"><div><h2>Workflow Events</h2><p>{rows.length} workflow events loaded from MSSQL with server-side filtering and polling updates.</p></div><span>virtual-ready</span></div><div className="wl-table-wrap"><table className="wl-table"><thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={fmt(row.id)} className={selectedId === fmt(row.id) ? 'selected' : ''} onClick={() => onSelect(fmt(row.id))}><td>{time(row.timestamp as string | null)}</td><td><Pill value={row.level} /></td><td>{fmt(row.eventType)}</td><td className="wl-title-cell">{fmt(row.workflowName)}</td><td>{fmt(row.workflowVersion)}</td><td>{fmt(row.workflowInstanceId).slice(0, 8)}</td><td>{fmt(row.stageCode)}</td><td>{fmt(row.transitionCode)}</td><td>{fmt(row.triggerCode)}</td><td>{fmt(row.actionCode)}</td><td>{fmt(row.agentCode)}</td><td>{fmt(row.jobId)}</td><td>{fmt(row.queueName)}</td><td>{fmt(row.workerId)}</td><td><Pill value={row.status} /></td><td>{fmt(row.message)}</td><td>{fmt(row.durationMs)} ms</td><td>{fmt(row.retryCount)}</td><td>{fmt(row.recoveryState)}</td><td>{fmt(row.approvalState)}</td><td>{fmt(row.outputState)}</td><td>{fmt(row.publishingState)}</td><td>{fmt(row.analyticsState)}</td><td>{fmt(row.learningState)}</td><td>{fmt(row.incidentId)}</td><td>{fmt(row.traceId)}</td><td>{fmt(row.correlationId)}</td><td>{fmt(row.organization)}</td><td>{fmt(row.brand)}</td><td>observed</td></tr>)}</tbody></table></div></section>
}

function Details({ row }: { row?: Row }) {
  if (!row) return <aside className="wl-card wl-detail"><h2>Event Details</h2><p>Select a workflow event to inspect context, trace identifiers, AI/job/recovery/output state, redacted metadata, and lineage indicators.</p></aside>
  const sections: Array<[string, Array<[string, unknown]>]> = [
    ['Overview', [['Timestamp', time(row.timestamp as string | null)], ['Severity', row.level], ['Type', row.eventType], ['Status', row.status], ['Duration', `${fmt(row.durationMs)} ms`], ['Environment', row.environment]]],
    ['Workflow Context', [['Workflow', row.workflowName], ['Code', row.workflowCode], ['Version', row.workflowVersion], ['Instance', row.workflowInstanceId], ['Stage', row.stageCode], ['Transition', row.transitionCode], ['Trigger', row.triggerCode]]],
    ['Execution Context', [['Action', row.actionCode], ['Queue', row.queueName], ['Worker', row.workerId], ['Job', row.jobId], ['Retries', row.retryCount], ['Recovery', row.recoveryState]]],
    ['AI and Approval', [['Agent', row.agentCode], ['Agent run', row.agentRunId], ['Confidence', row.confidence], ['Cost', row.cost], ['Approval', row.approvalState], ['Request', row.approvalRequestId]]],
    ['Output and Correlation', [['Output', row.outputId], ['Output state', row.outputState], ['Publishing', row.publishingState], ['Analytics', row.analyticsState], ['Learning', row.learningState], ['Trace', row.traceId], ['Correlation', row.correlationId]]],
  ]
  return <aside className="wl-card wl-detail"><h2>{fmt(row.eventType)}</h2><Pill value={row.level} />{sections.map(([title, items]) => <section key={title}><h3>{title}</h3><dl>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{fmt(value)}</dd></div>)}</dl></section>)}<section><h3>Redacted Metadata</h3><code>{fmt(row.metadataJson)}</code></section></aside>
}

function Panel({ title, rows, fields, note }: { title: string; rows: Row[]; fields: Array<[string, string]>; note?: string }) {
  return <section className="wl-card"><div className="wl-section-head"><div><h2>{title}</h2><p>{note ?? (rows.length ? 'Database-backed records loaded.' : 'No current records.')}</p></div></div><div className="wl-panel-list">{rows.slice(0, 8).map((row, index) => <article key={fmt(row.id ?? row.traceId ?? row.outputId ?? index)}>{fields.map(([label, key]) => <p key={key}><span>{label}</span><b>{fmt(row[key])}</b></p>)}</article>)}</div></section>
}

function TraceExplorer({ rows }: { rows: Row[] }) {
  return <section className="wl-card"><div className="wl-section-head"><div><h2>Trace Explorer</h2><p>Trigger, workflow, stage, action/agent, queue, worker, output, approval, publishing, analytics, learning, and final result nodes.</p></div></div><div className="wl-trace">{rows.slice(0, 12).map((row) => <article key={fmt(row.id)}><h3>{fmt(row.spanName)}</h3><Pill value={row.status} /><p>{fmt(row.spanType)} / {fmt(row.durationMs)} ms</p><small>{fmt(row.traceId)} / {fmt(row.recoveryState)} / {fmt(row.outputRef)}</small></article>)}</div></section>
}

export function WorkflowLogsDashboard() {
  const [data, setData] = useState<Data>(emptyData)
  const [query, setQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())
  const url = useMemo(() => { const params = new URLSearchParams(); if (query.trim()) params.set('q', query.trim()); Object.entries(selectedFilters).forEach(([k, v]) => v && v !== 'All' && params.set(k, v)); return `/api/v1/workflow-logs${params.toString() ? `?${params}` : ''}` }, [query, selectedFilters])
  const load = useCallback(async () => { try { const response = await fetch(url, { cache: 'no-store' }); const payload = (await response.json()) as Envelope<Data>; if (!response.ok || !payload.success) throw new Error(payload.message); setData(payload.data); setSelectedId((current) => current ?? fmt(payload.data.workflowEvents[0]?.id)); setError(null) } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Workflow logs unavailable') } }, [url])
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const poll = window.setInterval(() => void load(), 10000); return () => { window.clearTimeout(initial); window.clearInterval(poll) } }, [load])
  useEffect(() => { const clock = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(clock) }, [])
  const selected = data.workflowEvents.find((row) => fmt(row.id) === selectedId)

  return <main className="wl-page"><header className="wl-header"><div><nav>Workflow Automation / Workflow Logs</nav><h1>Workflow Logs</h1><p>Trace, correlate, investigate, and understand every workflow execution from trigger to final business result.</p><div className="wl-meta"><span><Radio size={14} /> Workflow Logging: Active</span><span><Zap size={14} /> Real-Time Stream: Connected</span><span><GitBranch size={14} /> Active Traces: {fmt(data.summary.activeWorkflowTraces)}</span><span><ShieldCheck size={14} /> Final-Output Traces: {fmt(data.summary.finalOutputConfirmations)}</span><span><Database size={14} /> {fmt(data.dataSource)}</span></div></div><div className="wl-clock">{fullClock(now)}</div></header>{error ? <div className="wl-error">{error}</div> : null}<section className="wl-kpis">{(data.summary.kpis ?? []).map((item, index) => <Kpi key={fmt(item.key)} item={item} icon={icons[index] ?? Activity} onFilter={() => setSelectedFilters({ ...selectedFilters, level: fmt(item.key) === 'failed' ? 'error' : selectedFilters.level ?? 'All' })} />)}</section><ObservabilityStatus status={data.observabilityStatus} /><section className="wl-grid-two"><Flow title="Workflow Trace Lifecycle" rows={data.traceLifecycle} /><Flow title="Failure and Recovery Path" rows={data.failurePath} /></section><QueryPanel query={query} setQuery={setQuery} selectedFilters={selectedFilters} setSelectedFilters={setSelectedFilters} data={data} /><section className="wl-grid-two"><LiveStream rows={data.eventStream} /><TraceExplorer rows={data.traceExplorer} /></section><section className="wl-main"><EventsTable rows={data.workflowEvents} selectedId={selectedId} onSelect={setSelectedId} /><Details row={selected} /></section><section className="wl-grid-two"><Panel title="Stage Execution Timeline" rows={data.stageTimeline} fields={[['Stage', 'stageName'], ['Queue wait', 'queueWaitMs'], ['Execution', 'executionDurationMs'], ['Agent', 'agentDurationMs'], ['Recovery', 'recoveryDurationMs'], ['Bottleneck', 'bottleneck']]} /><Panel title="Transition Decision Trace" rows={data.transitionTrace} fields={[['Source', 'sourceStage'], ['Selected', 'transitionSelected'], ['Conditions', 'conditionsEvaluated'], ['Confidence', 'confidence'], ['Risk', 'risk'], ['Guardrail', 'guardrailResult']]} /><Panel title="AI Agent Trace" rows={data.agentTrace} fields={[['Agent', 'agentCode'], ['Provider', 'provider'], ['Model', 'model'], ['Tokens', 'outputTokens'], ['Confidence', 'confidence'], ['Outcome', 'finalOutcome']]} /><Panel title="Background Job Trace" rows={data.jobTrace} fields={[['Job', 'jobId'], ['Queue', 'queueName'], ['Worker', 'workerId'], ['Progress', 'progressPercent'], ['Recovery', 'recoveryState'], ['Final', 'finalState']]} /></section><section className="wl-grid-two"><Panel title="Recovery History" rows={data.recoveryHistory} fields={[['Step', 'stepName'], ['Evidence', 'evidence'], ['Confidence', 'confidence'], ['Risk', 'risk'], ['Outcome', 'outcome'], ['Audit', 'auditReference']]} /><Panel title="Final-Output Lineage" rows={data.outputLineage} fields={[['Output', 'outputId'], ['Type', 'outputType'], ['Source', 'sourceStage'], ['Validation', 'validationStatus'], ['Publishing', 'publishingDestination'], ['Business result', 'finalBusinessResult']]} /><Panel title="Error Clustering" rows={data.errorClusters} fields={[['Cluster', 'clusterName'], ['Error', 'errorCode'], ['Occurrences', 'occurrenceCount'], ['Recovery', 'recoveryRate'], ['Root cause', 'rootCause'], ['Impact', 'finalOutputImpact']]} /><Panel title="Trace Completeness" rows={data.traceCompleteness} fields={[['Trace', 'traceId'], ['Expected', 'expectedEvents'], ['Received', 'receivedEvents'], ['Missing', 'missingEvents'], ['Complete', 'completenessPercent'], ['State', 'state']]} /></section><section className="wl-grid-two"><Panel title="Saved Views" rows={data.savedViews} fields={[['View', 'viewName'], ['Query', 'queryText'], ['Owner', 'owner'], ['Created', 'createdAt']]} /><Panel title="Alert Rules" rows={data.alertRules} fields={[['Rule', 'name'], ['Query', 'queryText'], ['Window', 'evaluationWindow'], ['Severity', 'severity'], ['Incident', 'autoCreateIncident'], ['Enabled', 'enabled']]} /><Panel title="Investigations" rows={data.investigations} fields={[['Name', 'investigationName'], ['Team', 'assignedTeam'], ['Owner', 'owner'], ['Status', 'status'], ['Tags', 'tags'], ['Package', 'exportPackage']]} /><Panel title="Workflow Log Analytics" rows={data.analytics} fields={[['Event', 'eventType'], ['Workflow', 'workflowName'], ['Stage', 'stageCode'], ['Count', 'eventCount'], ['Errors', 'errorCount'], ['Cost', 'totalCost']]} /></section><section className="wl-grid-two"><Panel title="Retention and Storage" rows={data.retention} fields={[['Class', 'eventClass'], ['Hot', 'hotDays'], ['Warm', 'warmDays'], ['Archive', 'archiveDays'], ['Retention', 'retentionDays'], ['Tier', 'storageTier']]} /><Panel title="Security and Redaction" rows={[{ id: 'redaction', secrets: 'redacted', apiKeys: 'redacted', tokens: 'redacted', passwords: 'never logged', personalData: 'masked', exports: 'audited' }]} fields={[['Secrets', 'secrets'], ['API keys', 'apiKeys'], ['Tokens', 'tokens'], ['Passwords', 'passwords'], ['Personal data', 'personalData'], ['Exports', 'exports']]} note="Sensitive workflow-log metadata is redacted before display." /></section><section className="wl-card wl-bottom"><h2>Autonomous Observability Contract</h2><p>Live tail, saved views, alert rules, investigations, export, and incident creation are represented by database-backed state and guarded API contracts. This page does not introduce routine manual workflow control; it observes, correlates, explains, and preserves final-output lineage.</p></section></main>
}
