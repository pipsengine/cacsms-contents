'use client'

import { Activity, AlertTriangle, BrainCircuit, CheckCircle2, Clock3, Database, FileWarning, GitBranch, HeartPulse, Search, ShieldCheck, Workflow, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Row = Record<string, unknown>
type Data = {
  summary: Row & { kpis?: Row[] }
  controlStatus: Row
  lifecycle: Row[]
  escalationPath: Row[]
  categories: Row[]
  failures: Row[]
  rootCauseIntelligence: Row[]
  recoveryStrategies: Row[]
  checkpoints: Row[]
  outputPreservation: Row[]
  repeatedPatterns: Row[]
  compensations: Row[]
  recoveryPolicies: Row[]
  recoveries?: Row[]
  operationsBoard: Row[]
  incidents: Row[]
  analytics: Row[]
  autonomousDecisions: Row[]
  failureLearning: Row[]
  finalOutputProtection: Row[]
  filters: Record<string, string[]>
  savedViews: string[]
  dataSource: string
  realtime: Row
}
type Envelope<T> = { success: boolean; message: string; data: T }

const emptyData: Data = { summary: {}, controlStatus: {}, lifecycle: [], escalationPath: [], categories: [], failures: [], rootCauseIntelligence: [], recoveryStrategies: [], checkpoints: [], outputPreservation: [], repeatedPatterns: [], compensations: [], recoveryPolicies: [], operationsBoard: [], incidents: [], analytics: [], autonomousDecisions: [], failureLearning: [], finalOutputProtection: [], filters: {}, savedViews: [], dataSource: 'database', realtime: {} }
const icons: LucideIcon[] = [FileWarning, Activity, CheckCircle2, HeartPulse, AlertTriangle, ShieldCheck, Clock3, Database, Workflow, BrainCircuit]
const filterKeys = ['status', 'category', 'severity', 'workflow', 'failedStage', 'recoveryPolicy', 'queue', 'provider', 'model', 'slaStatus', 'publishingImpact', 'finalOutputImpact', 'brand']

function fmt(value: unknown) { return value === null || value === undefined || value === '' ? '-' : String(value) }
function pct(value: unknown) { return `${Number(value ?? 0).toFixed(1)}%` }
function slug(value: unknown) { return fmt(value).toLowerCase().replace(/[^a-z0-9]+/g, '-') }
function time(value?: string | null) { return value ? new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '-' }
function fullClock(value: Date) { return new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }).format(value) }
function Pill({ value }: { value: unknown }) { return <span className={`fw-pill ${slug(value)}`}>{fmt(value)}</span> }

function Kpi({ item, icon: Icon, onFilter }: { item: Row; icon: LucideIcon; onFilter: () => void }) {
  return <article className={`fw-kpi ${slug(item.status)}`} onClick={onFilter} title={`${fmt(item.label)} / ${fmt(item.dataSource)}`}><span><Icon size={18} /></span><div><small>{fmt(item.label)}</small><b>{fmt(item.value)}</b><p>{fmt(item.trend)} / {fmt(item.status)}</p></div></article>
}

function ControlStatus({ status }: { status: Row }) {
  const items: Array<[string, unknown]> = [['Failure detector', status.failureDetector], ['Root-cause analyzer', status.rootCauseAnalyzer], ['Recovery policy', status.recoveryPolicyEngine], ['Checkpoint service', status.checkpointService], ['Compensation', status.compensationEngine], ['Worker reassignment', status.workerReassignment], ['Provider fallback', status.providerFallback], ['Queue recovery', status.queueRecovery], ['Output preservation', status.outputPreservation], ['Incident creation', status.incidentCreation], ['Learning feedback', status.learningFeedback], ['Audit pipeline', status.auditPipeline], ['Active failures', status.activeFailures], ['Under diagnosis', status.failuresUnderDiagnosis], ['Recoveries in progress', status.recoveriesInProgress], ['Recovery queue depth', status.recoveryQueueDepth], ['Recovered today', status.recoveriesCompletedToday], ['Recovery failures', status.recoveryFailures], ['Dominant failure', status.currentDominantFailureType], ['Current bottleneck', status.currentBottleneck], ['Last autonomous recovery', status.lastAutonomousRecovery], ['Human attention', status.humanAttentionRequired]]
  return <section className="fw-card"><div className="fw-section-head"><div><h2>Autonomous Failure Control</h2><p>Failure detection, diagnosis, recovery policy selection, checkpoint restore, compensation, incident creation, learning, and audit are database-backed.</p></div><Pill value={status.operatingMode} /></div><div className="fw-status-grid">{items.map(([label, value]) => <div key={label}><span>{label}</span><b>{fmt(value)}</b></div>)}</div></section>
}

function Flow({ title, rows }: { title: string; rows: Row[] }) {
  return <section className="fw-card"><div className="fw-section-head"><div><h2>{title}</h2><p>Stage count, recovery duration, SLA risk, output risk, blockers, and current health.</p></div></div><div className="fw-life">{rows.map((row) => <article key={fmt(row.name)}><h3>{fmt(row.name)}</h3><b>{fmt(row.workflowCount)} workflows</b><p>{fmt(row.averageDurationSeconds)}s avg / {fmt(row.failureCount)} failures</p><small>{fmt(row.successCount)} success / {fmt(row.slaRisk)} SLA / {pct(row.healthPercent)} health</small></article>)}</div></section>
}

function CategoryCards({ rows, onFilter }: { rows: Row[]; onFilter: (category: string) => void }) {
  return <section className="fw-card"><div className="fw-section-head"><div><h2>Failure Categories</h2><p>Autonomous category health, recovery rates, related incidents, and final-output risk.</p></div><span>{rows.length} live categories</span></div><div className="fw-category-grid">{rows.map((row) => <article key={fmt(row.id ?? row.categoryName)} onClick={() => onFilter(fmt(row.categoryName))}><h3>{fmt(row.categoryName)}</h3><Pill value={row.finalOutputRisk} /><b>{fmt(row.failureCount)} failures / {fmt(row.recoveringCount)} recovering</b><p>{pct(row.recoverySuccessRate)} success / {fmt(row.recoveredToday)} recovered today</p><small>{fmt(row.relatedIncidents)} incidents / {pct(row.healthPercent)} health / {time(row.lastOccurrence as string | null)}</small></article>)}</div></section>
}

function FailuresTable({ rows, selectedId, onSelect }: { rows: Row[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const heads = ['Failure ID','Workflow','Version','Instance','Reference','Failed Stage','Category','Error Code','Severity','Status','Detected','Age','Retries','Recovery','Policy','Checkpoint','Output','Assigned Worker','Previous Worker','Queue','Provider','Model','SLA','Publishing','Final Output','Incident','Organization','Brand','State']
  return <section className="fw-card fw-table-card"><div className="fw-section-head"><div><h2>Failed Workflows</h2><p>{rows.length} live failure rows loaded from MSSQL views with polling updates.</p></div><span>server-side data</span></div><div className="fw-table-wrap"><table className="fw-table"><thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={fmt(row.id)} className={selectedId === fmt(row.id) ? 'selected' : ''} onClick={() => onSelect(fmt(row.id))}><td>{fmt(row.id).slice(0, 8)}</td><td className="fw-title-cell">{fmt(row.workflowName)}</td><td>{fmt(row.workflowVersion)}</td><td>{fmt(row.workflowInstanceId).slice(0, 8)}</td><td>{fmt(row.referenceId)}</td><td>{fmt(row.failedStage)}</td><td>{fmt(row.failureCategory)}</td><td>{fmt(row.failureCode)}</td><td><Pill value={row.severity} /></td><td><Pill value={row.status} /></td><td>{time(row.detectedAt as string | null)}</td><td>{fmt(row.failureAgeMinutes)}m</td><td>{fmt(row.retryCount)}</td><td>{fmt(row.recoveryState)}</td><td>{fmt(row.recoveryPolicy)}</td><td>{fmt(row.checkpointAvailable)}</td><td>{fmt(row.outputPreserved)}</td><td>{fmt(row.assignedWorkerId)}</td><td>{fmt(row.previousWorkerId)}</td><td>{fmt(row.queueName)}</td><td>{fmt(row.providerId)}</td><td>{fmt(row.modelId)}</td><td><Pill value={row.slaStatus} /></td><td>{fmt(row.publishingImpact)}</td><td>{fmt(row.finalOutputImpact)}</td><td>{fmt(row.incident)}</td><td>{fmt(row.organization)}</td><td>{fmt(row.brand)}</td><td>autonomous observation</td></tr>)}</tbody></table></div></section>
}

function Details({ row }: { row?: Row }) {
  if (!row) return <aside className="fw-card fw-detail"><h2>Failure Details</h2><p>Select a failure row to inspect context, diagnosis, recovery, output preservation, impact, incident state, and timeline.</p></aside>
  const sections: Array<[string, Array<[string, unknown]>]> = [
    ['Overview', [['Failure', fmt(row.id).slice(0, 8)], ['Workflow', row.workflowName], ['Instance', row.workflowInstanceId], ['Version', row.workflowVersion], ['Reference', row.referenceId], ['Stage', row.failedStage], ['Status', row.status], ['Severity', row.severity], ['Correlation', row.correlationId]]],
    ['Failure Context', [['Error code', row.failureCode], ['Category', row.failureCategory], ['Retryable', row.retryable], ['Recoverable', row.recoverable], ['Queue', row.queueName], ['Worker', row.assignedWorkerId], ['Provider', row.providerId], ['Model', row.modelId]]],
    ['Recovery', [['Policy', row.recoveryPolicy], ['Recovery state', row.recoveryState], ['Retry count', row.retryCount], ['Checkpoint', row.checkpointAvailable], ['Output preserved', row.outputPreserved], ['Recovered at', time(row.recoveredAt as string | null)]]],
    ['Impact', [['SLA', row.slaStatus], ['Publishing', row.publishingImpact], ['Final output', row.finalOutputImpact], ['Incident', row.incident], ['Brand', row.brand], ['Organization', row.organization]]],
  ]
  return <aside className="fw-card fw-detail"><h2>{fmt(row.referenceId)}</h2><Pill value={row.status} />{sections.map(([title, items]) => <section key={title}><h3>{title}</h3><dl>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{fmt(value)}</dd></div>)}</dl></section>)}</aside>
}

function Panel({ title, rows, fields, note }: { title: string; rows: Row[]; fields: Array<[string, string]>; note?: string }) {
  return <section className="fw-card"><div className="fw-section-head"><div><h2>{title}</h2><p>{note ?? (rows.length ? 'Database-backed records loaded.' : 'No active records in this view.')}</p></div></div><div className="fw-panel-list">{rows.slice(0, 8).map((row, index) => <article key={fmt(row.id ?? row.workflowFailureId ?? index)}>{fields.map(([label, key]) => <p key={key}><span>{label}</span><b>{fmt(row[key])}</b></p>)}</article>)}</div></section>
}

function OperationsBoard({ rows }: { rows: Row[] }) {
  const states = ['Detected', 'Diagnosing', 'Recoverable', 'Recovering', 'Compensating', 'Recovered', 'Escalated', 'Unrecoverable']
  return <section className="fw-card"><div className="fw-section-head"><div><h2>Recovery Operations Board</h2><p>Autonomous state lanes. Drag-and-drop is intentionally unavailable in normal operation.</p></div></div><div className="fw-board">{states.map((state) => <article key={state}><h3>{state}</h3>{rows.filter((row) => fmt(row.status) === state || fmt(row.recoveryState) === state).slice(0, 4).map((row) => <div key={fmt(row.id)}><b>{fmt(row.workflowName)}</b><span>{fmt(row.failedStage)} / {fmt(row.finalOutputImpact)}</span><small>{fmt(row.failureAgeMinutes)}m / {fmt(row.recoveryState)}</small></div>)}</article>)}</div></section>
}

export function FailedWorkflowsDashboard() {
  const [data, setData] = useState<Data>(emptyData)
  const [query, setQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())
  const url = useMemo(() => { const params = new URLSearchParams(); if (query.trim()) params.set('q', query.trim()); Object.entries(selectedFilters).forEach(([k, v]) => v && v !== 'All' && params.set(k, v)); return `/api/v1/failed-workflows${params.toString() ? `?${params}` : ''}` }, [query, selectedFilters])
  const load = useCallback(async () => { try { const response = await fetch(url, { cache: 'no-store' }); const payload = (await response.json()) as Envelope<Data>; if (!response.ok || !payload.success) throw new Error(payload.message); setData(payload.data); setSelectedId((current) => current ?? fmt(payload.data.failures[0]?.id)); setError(null) } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Failed workflows unavailable') } }, [url])
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const poll = window.setInterval(() => void load(), 10000); return () => { window.clearTimeout(initial); window.clearInterval(poll) } }, [load])
  useEffect(() => { const clock = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(clock) }, [])
  const selected = data.failures.find((row) => fmt(row.id) === selectedId)

  return <main className="fw-page"><header className="fw-header"><div><nav>Workflow Automation / Failed Workflows</nav><h1>Failed Workflows</h1><p>Automatically diagnose, recover, replay, compensate, and learn from failed workflow executions across the AI Media Operating System.</p><div className="fw-meta"><span><Zap size={14} /> Recovery Engine: Running</span><span><BrainCircuit size={14} /> Autonomous Diagnosis: Enabled</span><span><GitBranch size={14} /> Checkpoint Recovery: Enabled</span><span><ShieldCheck size={14} /> Compensation Engine: Enabled</span><span><Database size={14} /> {fmt(data.dataSource)}</span></div></div><div className="fw-clock">{fullClock(now)}</div></header>{error ? <div className="fw-error">{error}</div> : null}<section className="fw-kpis">{(data.summary.kpis ?? []).map((item, index) => <Kpi key={fmt(item.key)} item={item} icon={icons[index] ?? Activity} onFilter={() => setSelectedFilters({ ...selectedFilters, status: fmt(item.key) === 'recovering' ? 'Recovering' : selectedFilters.status ?? 'All' })} />)}</section><ControlStatus status={data.controlStatus} /><section className="fw-grid-two"><Flow title="Failure Lifecycle" rows={data.lifecycle} /><Flow title="Escalation Path" rows={data.escalationPath} /></section><CategoryCards rows={data.categories} onFilter={(category) => setSelectedFilters({ ...selectedFilters, category })} /><section className="fw-query"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search failures, workflows, stages, references, brands..." /></label><div>{filterKeys.map((key) => <label key={key}>{key}<select value={selectedFilters[key] ?? 'All'} onChange={(event) => setSelectedFilters({ ...selectedFilters, [key]: event.target.value })}><option>All</option>{(data.filters[key] ?? []).map((value) => <option key={value}>{value}</option>)}</select></label>)}</div></section><section className="fw-main"><FailuresTable rows={data.failures} selectedId={selectedId} onSelect={setSelectedId} /><Details row={selected} /></section><section className="fw-grid-two"><Panel title="Root-Cause Intelligence" rows={data.rootCauseIntelligence} fields={[['Workflow', 'workflowName'], ['Cause', 'probableCause'], ['Confidence', 'confidencePercent'], ['Evidence', 'evidenceSummary'], ['Recovery', 'suggestedRecovery'], ['Output impact', 'finalOutputImpact']]} /><Panel title="Autonomous Recovery Strategies" rows={data.recoveryStrategies} fields={[['Policy', 'policyName'], ['Code', 'policyCode'], ['Retry', 'retryStrategy'], ['Checkpoint', 'checkpointStrategy'], ['Provider fallback', 'providerFallback'], ['Incident threshold', 'incidentThreshold']]} /><Panel title="Checkpoint Recovery" rows={data.checkpoints} fields={[['Workflow', 'workflowName'], ['Stage', 'failedStage'], ['Checkpoint', 'checkpointType'], ['Resume point', 'resumePoint'], ['Eligibility', 'recoveryEligibility'], ['Result', 'recoveryResult']]} /><Panel title="Output Preservation" rows={data.outputPreservation} fields={[['Workflow', 'workflowName'], ['Output', 'outputType'], ['Version', 'outputVersion'], ['Validation', 'validationStatus'], ['Storage', 'storageState'], ['Final link', 'finalOutputLinkage']]} /></section><section className="fw-grid-two"><Panel title="Repeated Failure Detection" rows={data.repeatedPatterns} fields={[['Pattern', 'patternName'], ['Occurrences', 'occurrenceCount'], ['Affected workflows', 'affectedWorkflows'], ['Root cause', 'estimatedRootCause'], ['Fix', 'recommendedPermanentFix'], ['Auto-remediation', 'autoRemediationEligibility']]} /><Panel title="Compensation Actions" rows={data.compensations} fields={[['Trigger', 'triggerReason'], ['Target', 'targetResource'], ['Status', 'status'], ['Reversible', 'reversibility'], ['Risk', 'riskLevel'], ['Result', 'result']]} /><Panel title="Incident Escalation" rows={data.incidents} fields={[['Failure', 'referenceId'], ['Incident', 'incidentNumber'], ['Severity', 'severity'], ['Status', 'status'], ['Team', 'assignedTeam'], ['Attention', 'humanAttentionRequired']]} /><Panel title="Failure Analytics" rows={data.analytics} fields={[['Category', 'categoryName'], ['Failures', 'failureCount'], ['Recovering', 'recoveringCount'], ['Recovered', 'recoveredToday'], ['Success', 'recoverySuccessRate'], ['Health', 'healthPercent']]} /></section><OperationsBoard rows={data.operationsBoard} /><section className="fw-grid-two"><Panel title="Autonomous Decision Feed" rows={data.autonomousDecisions} fields={[['Workflow', 'workflowName'], ['Decision', 'decision'], ['Policy', 'policyName'], ['Confidence', 'confidencePercent'], ['Risk', 'riskLevel'], ['Outcome', 'outcome']]} /><Panel title="Failure Learning" rows={data.failureLearning} fields={[['Learning', 'learningType'], ['Signal', 'signal'], ['Update', 'recommendedUpdate'], ['Confidence', 'confidencePercent'], ['Status', 'status'], ['Impact', 'impactArea']]} /><Panel title="Final Output Protection" rows={data.finalOutputProtection} fields={[['Workflow', 'workflowName'], ['State', 'protectionState'], ['Partial', 'partialOutputs'], ['Recovered', 'outputsRecovered'], ['Publishing', 'publishingProtected'], ['Readiness', 'readinessPercent']]} /><Panel title="Emergency Controls" rows={[{ id: 'guarded', state: 'permission protected', confirmation: 'required', reason: 'required', audit: 'required', notification: 'required', rollback: 'assessed before execution' }]} fields={[['State', 'state'], ['Confirmation', 'confirmation'], ['Reason', 'reason'], ['Audit', 'audit'], ['Notify', 'notification'], ['Rollback', 'rollback']]} note="Manual emergency actions are represented as guarded API endpoints and blocked in build mode." /></section><section className="fw-card fw-bottom"><h2>Autonomous Recovery Contract</h2><p>Failure scan, diagnosis, recovery selection, checkpoint resume, worker reassignment, provider/model fallback, output revalidation, compensation, incident creation, and learning updates are surfaced as live database state. Routine recovery has no page-level manual buttons; protected mutation endpoints return 405 until emergency governance is explicitly enabled.</p><h2>Saved Views</h2><p>{data.savedViews.join(', ')}</p></section></main>
}
