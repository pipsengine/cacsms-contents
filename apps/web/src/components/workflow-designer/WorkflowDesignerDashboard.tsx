'use client'

import { Activity, Bot, CheckCircle2, Database, FileText, GitBranch, Layers3, Search, ShieldCheck, Workflow, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Row = Record<string, unknown>
type DesignerData = {
  definitions: Row[]
  selectedDefinition: Row | null
  versions: Row[]
  canvas: { nodes: Row[]; connections: Row[]; groups: Row[]; annotations: Row[]; variables: Row[]; inputSchemas: Row[]; outputSchemas: Row[] }
  nodeTypes: Row[]
  templates: Row[]
  validation: Row[]
  simulations: Row[]
  history: Row[]
  documentation: Row
  estimates: Row
  summary: Row
  dataSource: string
}
type Envelope<T> = { success: boolean; message: string; data: T }

const emptyData: DesignerData = {
  definitions: [],
  selectedDefinition: null,
  versions: [],
  canvas: { nodes: [], connections: [], groups: [], annotations: [], variables: [], inputSchemas: [], outputSchemas: [] },
  nodeTypes: [],
  templates: [],
  validation: [],
  simulations: [],
  history: [],
  documentation: {},
  estimates: {},
  summary: {},
  dataSource: 'database',
}

function fmt(value: unknown) {
  return value === null || value === undefined || value === '' ? '-' : String(value)
}

function time(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value))
}

function color(value: unknown) {
  return fmt(value).toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function Pill({ value }: { value: unknown }) {
  return <span className={`designer-pill ${color(value)}`}>{fmt(value)}</span>
}

function Palette({ nodeTypes, search, setSearch }: { nodeTypes: Row[]; search: string; setSearch: (value: string) => void }) {
  const filtered = nodeTypes.filter((node) => `${fmt(node.displayName)} ${fmt(node.category)} ${fmt(node.description)}`.toLowerCase().includes(search.toLowerCase()))
  const categories = Array.from(new Set(filtered.map((node) => fmt(node.category))))
  return (
    <aside className="designer-panel designer-palette">
      <div className="designer-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search components..." /></div>
      <div className="designer-palette-list">
        {categories.map((category) => (
          <section key={category}>
            <h3>{category}</h3>
            {filtered.filter((node) => fmt(node.category) === category).map((node) => (
              <article key={fmt(node.id)}>
                <span className={`designer-node-dot ${fmt(node.colorToken)}`} />
                <div><b>{fmt(node.displayName)}</b><p>{fmt(node.description)}</p><small>{fmt(node.requiredPermission)} · inputs {fmt(node.expectedInputsJson)} · outputs {fmt(node.expectedOutputsJson)}</small></div>
              </article>
            ))}
          </section>
        ))}
      </div>
    </aside>
  )
}

function Canvas({ nodes, connections, selectedNodeId, setSelectedNodeId }: { nodes: Row[]; connections: Row[]; selectedNodeId: string | null; setSelectedNodeId: (id: string) => void }) {
  return (
    <section className="designer-canvas-wrap">
      <div className="designer-canvas-toolbar">
        <span><Workflow size={14} /> Design</span>
        <span><CheckCircle2 size={14} /> Validation</span>
        <span><Activity size={14} /> Simulation</span>
        <span><Zap size={14} /> Performance</span>
        <span><GitBranch size={14} /> Dependency</span>
      </div>
      <div className="designer-canvas">
        {connections.map((connection) => <i key={fmt(connection.id)} className={`designer-connection ${color(connection.connectionType)}`} />)}
        {nodes.map((node) => (
          <article
            key={fmt(node.id)}
            className={`designer-node ${fmt(node.category).toLowerCase().replace(/\s+/g, '-')} ${selectedNodeId === fmt(node.id) ? 'selected' : ''}`}
            style={{ left: `${Number(node.positionX ?? 0)}px`, top: `${Number(node.positionY ?? 0)}px` }}
            onClick={() => setSelectedNodeId(fmt(node.id))}
          >
            <header><span className={`designer-node-dot ${color(node.category)}`} /><Pill value={node.validationState} /></header>
            <h3>{fmt(node.nodeName)}</h3>
            <p>{fmt(node.nodeType)}</p>
            <footer><span>{fmt(node.inputCount)} in</span><span>{fmt(node.outputCount)} out</span><span>{fmt(node.timeoutSeconds)}s</span></footer>
          </article>
        ))}
      </div>
    </section>
  )
}

function Properties({ definition, node, versions, documentation }: { definition: Row | null; node?: Row; versions: Row[]; documentation: Row }) {
  const cost = documentation.cost as Row | undefined
  const performance = documentation.performance as Row | undefined
  return (
    <aside className="designer-panel designer-properties">
      <h2>Properties</h2>
      <section>
        <h3>Workflow</h3>
        <dl>
          {([
            ['Name', definition?.name],
            ['Code', definition?.code],
            ['Category', definition?.category],
            ['Type', definition?.workflowType],
            ['Draft Version', definition?.currentDraftVersion],
            ['Published Version', definition?.currentPublishedVersion],
            ['Status', definition?.status],
            ['Execution Mode', definition?.executionMode],
            ['Owner', definition?.ownerId],
            ['Versions', versions.length],
          ] as Array<[string, unknown]>).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{fmt(value)}</dd></div>)}
        </dl>
      </section>
      <section>
        <h3>Selected Node</h3>
        {!node ? <p>Select a node on the canvas.</p> : (
          <dl>
            {([
              ['Name', node.nodeName],
              ['Type', node.nodeType],
              ['Category', node.category],
              ['Status', node.status],
              ['Validation', node.validationState],
              ['Retry Policy', node.retryPolicy],
              ['Timeout', `${fmt(node.timeoutSeconds)}s`],
              ['Approval Required', node.approvalRequired ? 'Yes' : 'No'],
              ['Warnings', node.warningCount],
              ['Errors', node.errorCount],
            ] as Array<[string, unknown]>).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{fmt(value)}</dd></div>)}
          </dl>
        )}
      </section>
      <section>
        <h3>Estimates</h3>
        <dl>
          <div><dt>Cost</dt><dd>{fmt(cost?.estimatedCost)} {fmt(cost?.currency)}</dd></div>
          <div><dt>Duration</dt><dd>{fmt(performance?.estimatedDurationSeconds)}s</dd></div>
          <div><dt>Throughput</dt><dd>{fmt(performance?.throughputPerHour)} / hour</dd></div>
          <div><dt>Bottleneck</dt><dd>{fmt(performance?.bottleneckNode)}</dd></div>
        </dl>
      </section>
    </aside>
  )
}

function BottomPanel({ validation, simulations, history, templates }: { validation: Row[]; simulations: Row[]; history: Row[]; templates: Row[] }) {
  return (
    <section className="designer-bottom">
      <article><h3>Validation</h3>{validation.map((row) => <p key={fmt(row.id)}><Pill value={row.status} /> {fmt(row.summary)} · {fmt(row.errorCount)} errors · {fmt(row.warningCount)} warnings</p>)}</article>
      <article><h3>Simulation</h3>{simulations.map((row) => <p key={fmt(row.id)}><Pill value={row.status} /> {fmt(row.summary)} · {fmt(row.simulatedDurationSeconds)}s · ${fmt(row.estimatedCost)}</p>)}</article>
      <article><h3>Templates</h3>{templates.slice(0, 5).map((row) => <p key={fmt(row.id)}>{fmt(row.templateName)} · {fmt(row.category)}</p>)}</article>
      <article><h3>Change History</h3>{history.slice(0, 5).map((row) => <p key={fmt(row.id)}>{time(row.createdAt as string | null)} · {fmt(row.changeSummary)}</p>)}</article>
    </section>
  )
}

export function WorkflowDesignerDashboard() {
  const [data, setData] = useState<DesignerData>(emptyData)
  const [definitionId, setDefinitionId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const url = useMemo(() => `/api/v1/workflow-designer${definitionId ? `?definitionId=${definitionId}` : ''}`, [definitionId])

  const load = useCallback(async () => {
    try {
      const response = await fetch(url, { cache: 'no-store' })
      const payload = (await response.json()) as Envelope<DesignerData>
      if (!response.ok || !payload.success) throw new Error(payload.message)
      setData(payload.data)
      setDefinitionId((current) => current || fmt(payload.data.selectedDefinition?.id))
      setSelectedNodeId((current) => current ?? fmt(payload.data.canvas.nodes[0]?.id))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Workflow designer data unavailable')
    }
  }, [url])

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0)
    const poll = window.setInterval(() => void load(), 10000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(poll)
    }
  }, [load])

  const selectedNode = data.canvas.nodes.find((node) => fmt(node.id) === selectedNodeId)

  return (
    <main className="designer-page">
      <header className="designer-header">
        <div>
          <nav>Workflow Automation / Workflow Designer</nav>
          <h1>Workflow Designer</h1>
          <p>Design, validate, simulate, publish, and optimize autonomous workflows across the AI Media Operating System.</p>
          <div className="designer-meta">
            <span><Layers3 size={14} /> Designer Mode: Database Synced</span>
            <span><Workflow size={14} /> {fmt(data.selectedDefinition?.name)}</span>
            <span><FileText size={14} /> v{fmt(data.selectedDefinition?.currentDraftVersion)}</span>
            <span><ShieldCheck size={14} /> {fmt(data.summary.validationStatus)}</span>
            <span><Database size={14} /> {fmt(data.dataSource)}</span>
          </div>
        </div>
        <label className="designer-definition-select">Current Workflow<select value={definitionId} onChange={(event) => { setDefinitionId(event.target.value); setSelectedNodeId(null) }}>{data.definitions.map((definition) => <option key={fmt(definition.id)} value={fmt(definition.id)}>{fmt(definition.name)}</option>)}</select></label>
      </header>
      {error ? <div className="designer-error">{error}</div> : null}
      <section className="designer-kpis">
        {[
          ['Definitions', data.summary.definitionCount, Workflow],
          ['Palette Items', data.summary.nodeTypeCount, Layers3],
          ['Templates', data.summary.templateCount, FileText],
          ['Canvas Nodes', data.summary.nodeCount, Bot],
          ['Connections', data.summary.connectionCount, GitBranch],
          ['Autosave', data.summary.autosaveStatus, CheckCircle2],
        ].map(([label, value, Icon]) => {
          const IconComponent = Icon as typeof Workflow
          return <article key={fmt(label)}><IconComponent size={18} /><span>{fmt(label)}</span><b>{fmt(value)}</b></article>
        })}
      </section>
      <section className="designer-layout">
        <Palette nodeTypes={data.nodeTypes} search={search} setSearch={setSearch} />
        <Canvas nodes={data.canvas.nodes} connections={data.canvas.connections} selectedNodeId={selectedNodeId} setSelectedNodeId={setSelectedNodeId} />
        <Properties definition={data.selectedDefinition} node={selectedNode} versions={data.versions} documentation={data.documentation} />
      </section>
      <BottomPanel validation={data.validation} simulations={data.simulations} history={data.history} templates={data.templates} />
    </main>
  )
}
