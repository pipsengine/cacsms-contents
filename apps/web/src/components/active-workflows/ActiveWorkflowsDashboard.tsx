'use client'

import { Activity, AlertTriangle, Bot, CheckCircle2, Clock3, Database, GitBranch, Search, ShieldCheck, Workflow, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Row = Record<string, unknown>
type Data = {
  summary: Row & { kpis?: Row[] }
  overview: Row
  pipeline: Row[]
  activeWorkflows: Row[]
  bottlenecks: Row[]
  recoveries: Row[]
  slaRisks: Row[]
  outputReadiness: Row[]
  agentActivity: Row[]
  jobActivity: Row[]
  autonomousDecisions: Row[]
  filters: Record<string, string[]>
  savedViews: string[]
  dataSource: string
  realtime: Row
}
type Envelope<T> = { success: boolean; message: string; data: T }
const emptyData: Data = { summary: {}, overview: {}, pipeline: [], activeWorkflows: [], bottlenecks: [], recoveries: [], slaRisks: [], outputReadiness: [], agentActivity: [], jobActivity: [], autonomousDecisions: [], filters: {}, savedViews: [], dataSource: 'database', realtime: {} }

function fmt(value: unknown) { return value === null || value === undefined || value === '' ? '-' : String(value) }
function pct(value: unknown) { return `${Number(value ?? 0).toFixed(1)}%` }
function time(value?: string | null) { return value ? new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '-' }
function seconds(value: unknown) { const total = Math.max(0, Number(value ?? 0)); return `${Math.floor(total / 60)}m ${Math.round(total % 60)}s` }
function slug(value: unknown) { return fmt(value).toLowerCase().replace(/[^a-z0-9]+/g, '-') }
function Pill({ value }: { value: unknown }) { return <span className={`aw-pill ${slug(value)}`}>{fmt(value)}</span> }
function Bit({ value }: { value: unknown }) { return <span className={`aw-bit ${Number(value) ? 'yes' : 'no'}`}>{Number(value) ? 'yes' : 'no'}</span> }

function Kpi({ item, icon: Icon, onFilter }: { item: Row; icon: LucideIcon; onFilter: () => void }) {
  return <article className={`aw-kpi ${slug(item.status)}`} onClick={onFilter} title={`${fmt(item.note)} / ${fmt(item.dataSource)}`}><span><Icon size={18} /></span><div><small>{fmt(item.label)}</small><b>{fmt(item.value)}</b><p>{fmt(item.trend)} / {fmt(item.status)}</p></div></article>
}

function Overview({ overview }: { overview: Row }) {
  const items: Array<[string, unknown]> = [
    ['Running workflows', overview.runningWorkflowCount], ['Running stages', overview.runningStageCount], ['Active AI agents', overview.activeAiAgents], ['Background jobs', overview.activeBackgroundJobs],
    ['Assigned workers', overview.assignedWorkers], ['Queue depth', overview.currentQueueDepth], ['Average progress', pct(overview.averageProgress)], ['Average elapsed', seconds(overview.averageElapsedSeconds)],
    ['Average ETA', seconds(overview.averageEtaSeconds)], ['Current bottleneck', overview.currentBottleneck], ['Recovery actions', overview.recoveryActionsInProgress], ['Final-output rate', pct(overview.expectedFinalOutputRate)],
  ]
  return <section className="aw-card aw-overview"><div className="aw-section-head"><div><h2>Active Execution Overview</h2><p>Autonomous execution, queue pressure, worker allocation, and final-output confidence.</p></div><Pill value={overview.operatingMode} /></div><div className="aw-overview-grid">{items.map(([label, value]) => <div key={label}><span>{label}</span><b>{fmt(value)}</b></div>)}</div></section>
}

function Pipeline({ rows, selectedStage, onSelect }: { rows: Row[]; selectedStage: string; onSelect: (stage: string) => void }) {
  return <section className="aw-card"><div className="aw-section-head"><div><h2>Real-Time Execution Pipeline</h2><p>Stage health, SLA pressure, queue depth, and autonomous actions.</p></div><Pill value={selectedStage === 'All' ? 'all stages' : selectedStage} /></div><div className="aw-pipeline">{rows.map((stage) => <article key={fmt(stage.stageName)} className={selectedStage === fmt(stage.stageName) ? 'selected' : ''} onClick={() => onSelect(selectedStage === fmt(stage.stageName) ? 'All' : fmt(stage.stageName))}><span>{fmt(stage.stageOrder)}</span><h3>{fmt(stage.stageName)}</h3><b>{fmt(stage.activeInstances)} active</b><p>{fmt(stage.completedToday)} done / {fmt(stage.failed)} failed / {fmt(stage.recovering)} recovering</p><small>{seconds(stage.avgDurationSeconds)} avg / queue {fmt(stage.queueDepth)} / {fmt(stage.slaRisk)}</small></article>)}</div></section>
}

function ActiveTable({ rows, selectedId, onSelect }: { rows: Row[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const heads = ['Instance ID','Workflow Name','Workflow Type','Trigger','Reference','Priority','Status','Current Stage','Progress %','Stage Progress %','Started At','Elapsed Time','Estimated Completion','SLA Status','AI Agents','Background Jobs','Queue','Worker','Approval State','Recovery State','Retry Count','Current Bottleneck','Final Output','Analytics State','Learning State','Organization','Brand','Owner','Autonomous Action']
  return <section className="aw-card aw-table-card"><div className="aw-section-head"><div><h2>Active Workflows</h2><p>{rows.length} active database rows with real-time polling updates.</p></div><span>server-side ready</span></div><div className="aw-table-wrap"><table className="aw-table"><thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={fmt(row.id)} className={selectedId === fmt(row.id) ? 'selected' : ''} onClick={() => onSelect(fmt(row.id))}><td>{fmt(row.correlationId)}</td><td className="aw-title-cell">{fmt(row.workflowName)}</td><td>{fmt(row.workflowType)}</td><td>{fmt(row.triggerName)}</td><td>{fmt(row.reference)}</td><td><Pill value={row.priority} /></td><td><Pill value={row.status} /></td><td>{fmt(row.currentStage)}</td><td>{pct(row.progressPercent)}</td><td>{pct(row.stageProgressPercent)}</td><td>{time(row.startedAt as string | null)}</td><td>{seconds(row.elapsedSeconds)}</td><td>{time(row.estimatedCompletionAt as string | null)}</td><td><Pill value={row.slaStatus} /></td><td>{fmt(row.aiAgents)}</td><td>{fmt(row.backgroundJobs)}</td><td>{fmt(row.queueName)}</td><td>{fmt(row.workerName)}</td><td>{fmt(row.approvalState)}</td><td>{fmt(row.recoveryState)}</td><td>{fmt(row.retryCount)}</td><td>{fmt(row.currentBottleneck)}</td><td><Pill value={row.finalOutput} /></td><td>{fmt(row.analyticsState)}</td><td>{fmt(row.learningState)}</td><td>{fmt(row.organization)}</td><td>{fmt(row.brand)}</td><td>{fmt(row.owner)}</td><td>{fmt(row.actionState)}</td></tr>)}</tbody></table></div></section>
}

function Details({ row, mapRows, output }: { row?: Row; mapRows: Row[]; output?: Row }) {
  if (!row) return <aside className="aw-card aw-detail"><h2>Workflow Instance Details</h2><p>Select a row to inspect execution path, AI activity, jobs, recovery, output readiness, and timeline signals.</p></aside>
  const details: Array<[string, unknown]> = [['Workflow', row.workflowName], ['Version', row.workflowVersion], ['Instance', row.correlationId], ['Trigger', row.triggerName], ['Reference', row.reference], ['Priority', row.priority], ['Status', row.status], ['Progress', pct(row.progressPercent)], ['Started', time(row.startedAt as string | null)], ['ETA', time(row.estimatedCompletionAt as string | null)], ['SLA', row.slaStatus], ['Guardrails', row.guardrailStatus]]
  const checks: Array<[string, unknown]> = [['Core content', output?.coreContentProduced], ['Validation', output?.validationCompleted], ['Approval', output?.approvalCompleted], ['Assets', output?.requiredAssetsCreated], ['Package', output?.publishingPackageReady], ['Published', output?.publishingCompleted], ['Analytics configured', output?.analyticsConfigured], ['Analytics collected', output?.analyticsCollected], ['Learning', output?.learningFeedbackCompleted], ['Business result', output?.businessResultGenerated]]
  const nodes: Node[] = mapRows.map((node, index) => ({ id: fmt(node.id), position: { x: (index % 3) * 190, y: Math.floor(index / 3) * 110 }, data: { label: `${fmt(node.name)} ${pct(node.progressPercent)}` }, className: `aw-flow-node ${slug(node.status)}`, draggable: false }))
  const edges: Edge[] = nodes.slice(1).map((node, index) => ({ id: `edge-${index}`, source: nodes[index].id, target: node.id, animated: node.className?.includes('running') || node.className?.includes('recovering'), type: 'smoothstep' }))
  return <aside className="aw-card aw-detail"><h2>{fmt(row.workflowName)}</h2><Pill value={row.status} /><dl>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{fmt(value)}</dd></div>)}</dl><h3>Execution Map</h3><div className="aw-map"><ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} panOnDrag zoomOnScroll><MiniMap pannable zoomable /><Controls showInteractive={false} /><Background /></ReactFlow></div><h3>Final Output</h3><div className="aw-checks">{checks.map(([label, value]) => <div key={label}><span>{label}</span><Bit value={value} /></div>)}</div></aside>
}

function PanelList({ title, rows, fields }: { title: string; rows: Row[]; fields: Array<[string, string]> }) {
  return <section className="aw-card"><div className="aw-section-head"><div><h2>{title}</h2><p>{rows.length ? 'Live database records loaded.' : 'No records in this state.'}</p></div></div><div className="aw-panel-list">{rows.slice(0, 8).map((row, index) => <article key={fmt(row.id ?? index)}>{fields.map(([label, key]) => <p key={key}><span>{label}</span><b>{fmt(row[key])}</b></p>)}</article>)}</div></section>
}

export function ActiveWorkflowsDashboard() {
  const [data, setData] = useState<Data>(emptyData)
  const [query, setQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedStage, setSelectedStage] = useState('All')
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState<Date | null>(null)
  const url = useMemo(() => { const params = new URLSearchParams(); if (query.trim()) params.set('q', query.trim()); Object.entries(selectedFilters).forEach(([k, v]) => v && v !== 'All' && params.set(k, v)); if (selectedStage !== 'All') params.set('currentStage', selectedStage); return `/api/v1/workflows/active${params.toString() ? `?${params}` : ''}` }, [query, selectedFilters, selectedStage])
  const load = useCallback(async () => { try { const response = await fetch(url, { cache: 'no-store' }); const payload = (await response.json()) as Envelope<Data>; if (!response.ok || !payload.success) throw new Error(payload.message); setData(payload.data); setSelectedId((current) => current ?? fmt(payload.data.activeWorkflows[0]?.id)); setError(null) } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Active workflows unavailable') } }, [url])
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const poll = window.setInterval(() => void load(), 8000); return () => { window.clearTimeout(initial); window.clearInterval(poll) } }, [load])
  useEffect(() => { const clock = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(clock) }, [])

  const selected = data.activeWorkflows.find((row) => fmt(row.id) === selectedId)
  const selectedOutput = data.outputReadiness.find((row) => fmt(row.id) === selectedId)
  const mapRows = selected ? data.pipeline.map((stage) => ({ id: stage.stageName, name: stage.stageName, status: fmt(stage.stageName) === fmt(selected.currentStage) ? selected.status : Number(stage.stageOrder) < 9 ? 'completed' : 'pending', progressPercent: fmt(stage.stageName) === fmt(selected.currentStage) ? selected.stageProgressPercent : Number(stage.stageOrder) < 9 ? 100 : 0 })) : []
  const icons = [Workflow, Activity, Clock3, ShieldCheck, Zap, AlertTriangle, CheckCircle2, AlertTriangle, GitBranch, Bot]
  const filterKeys = ['workflowType', 'status', 'currentStage', 'priority', 'slaStatus', 'queue', 'worker', 'approvalState', 'recoveryState', 'brand', 'finalOutput']

  return <main className="aw-page"><header className="aw-header"><div><nav>Workflow Automation / Active Workflows</nav><h1>Active Workflows</h1><p>Monitor and autonomously supervise every workflow currently executing across the AI Media Operating System.</p><div className="aw-meta"><span><Workflow size={14} /> Workflow Engine: Running</span><span><ShieldCheck size={14} /> Automation Mode: Fully Autonomous</span><span><Activity size={14} /> Active {fmt(data.summary.activeWorkflows)}</span><span><Database size={14} /> {fmt(data.dataSource)}</span></div></div><div className="aw-clock">{now ? new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now) : 'Loading Nigeria time'}</div></header>{error ? <div className="aw-error">{error}</div> : null}<section className="aw-kpis">{(data.summary.kpis ?? []).map((item, index) => <Kpi key={fmt(item.key)} item={item} icon={icons[index] ?? Activity} onFilter={() => setSelectedFilters({ ...selectedFilters, status: fmt(item.key) === 'running' ? 'running' : selectedFilters.status ?? 'All' })} />)}</section><Overview overview={data.overview} /><Pipeline rows={data.pipeline} selectedStage={selectedStage} onSelect={setSelectedStage} /><section className="aw-query"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search active workflows, references, workers..." /></label><div>{filterKeys.map((key) => <label key={key}>{key}<select value={selectedFilters[key] ?? 'All'} onChange={(event) => setSelectedFilters({ ...selectedFilters, [key]: event.target.value })}><option>All</option>{(data.filters[key] ?? []).map((value) => <option key={value}>{value}</option>)}</select></label>)}</div></section><section className="aw-main"><ActiveTable rows={data.activeWorkflows} selectedId={selectedId} onSelect={setSelectedId} /><Details row={selected} mapRows={mapRows} output={selectedOutput} /></section><section className="aw-grid-two"><PanelList title="Bottleneck Intelligence" rows={data.bottlenecks} fields={[['Workflow', 'workflowName'], ['Stage', 'stage'], ['Root cause', 'rootCause'], ['Confidence', 'confidencePercent'], ['SLA impact', 'slaImpact'], ['Autonomous action', 'autonomousActionSelected']]} /><PanelList title="Recovery Operations" rows={data.recoveries} fields={[['Workflow', 'workflowName'], ['Failure', 'failure'], ['Strategy', 'recoveryStrategy'], ['Confidence', 'confidencePercent'], ['Progress', 'progressPercent'], ['Outcome', 'outcome']]} /><PanelList title="SLA and Completion Risk" rows={data.slaRisks.filter((row) => fmt(row.slaStatus) !== 'within_sla')} fields={[['Workflow', 'workflowName'], ['Time remaining', 'timeRemainingMinutes'], ['Bottleneck', 'currentBottleneck'], ['Risk', 'riskPercent'], ['Mitigation', 'autonomousMitigation'], ['Improvement', 'expectedImprovement']]} /><PanelList title="Final-Output Readiness" rows={data.outputReadiness} fields={[['Workflow', 'workflowName'], ['Readiness', 'readinessPercent'], ['Status', 'readinessStatus'], ['Publishing', 'publishingCompleted'], ['Analytics', 'analyticsCollected'], ['Learning', 'learningFeedbackCompleted']]} /></section><section className="aw-grid-two"><PanelList title="Active AI Agents" rows={data.agentActivity} fields={[['Agent', 'agent'], ['Workflow', 'workflowName'], ['Stage', 'stage'], ['Provider', 'provider'], ['Status', 'status'], ['Confidence', 'confidencePercent']]} /><PanelList title="Active Background Jobs" rows={data.jobActivity} fields={[['Job', 'id'], ['Workflow', 'workflowName'], ['Queue', 'queueName'], ['Worker', 'workerName'], ['Status', 'status'], ['Recovery', 'recoveryState']]} /></section><section className="aw-card aw-decisions"><div className="aw-section-head"><div><h2>Autonomous Decision Feed</h2><p>Engine actions, policies, outcomes, confidence, and human-input flags.</p></div><Pill value={fmt(data.realtime.mode)} /></div>{data.autonomousDecisions.slice(0, 12).map((decision) => <article key={fmt(decision.id)}><time>{time(decision.createdAt as string | null)}</time><b>{fmt(decision.workflowName)}</b><span>{fmt(decision.detection)} / {fmt(decision.decision)} / {fmt(decision.policyName)}</span><Pill value={Number(decision.humanInputRequired) ? 'human input required' : 'autonomous'} /></article>)}</section><section className="aw-card aw-bottom"><h2>Saved Views</h2><p>{data.savedViews.join(', ')}</p><h2>Emergency Controls</h2><p>Permission-protected emergency operations are not exposed for routine workflow supervision. Backend emergency endpoints are present and currently return 405 until elevated controls are explicitly enabled.</p></section></main>
}
