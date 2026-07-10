'use client'

import {
  AlertCircle,
  Bot,
  CheckCircle2,
  CircleHelp,
  Database,
  FileText,
  GitBranch,
  Layers3,
  Network,
  Route,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type MatrixRow = {
  module?: string
  page?: string
  status?: string
  health_percent?: number
  route_linked?: boolean
  component_ready?: boolean
  api_linked?: boolean
  storage_validated?: boolean
  final_output_ready?: boolean
}

type ValidationSnapshot = {
  instance: { id: string; status: string; progressPercent: number; currentStage?: string | null }
  steps: { id: string; stageName: string; status: string; progressPercent: number }[]
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

const checkColumns = [
  ['Route', 'route_linked'],
  ['Component', 'component_ready'],
  ['API', 'api_linked'],
  ['Storage', 'storage_validated'],
  ['Final Output', 'final_output_ready'],
] as const

function StatusDot({ value }: { value: unknown }) {
  if (value === true || value === 'completed' || value === 'ready') return <CheckCircle2 className="impl-dot completed" size={15} />
  if (value === false || value === 'failed') return <AlertCircle className="impl-dot failed" size={15} />
  return <span className="impl-dot-ring pending" />
}

function normalizeStatus(status?: string) {
  if (!status) return 'Pending'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function ImplementationStatusDashboard() {
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([])
  const [validation, setValidation] = useState<ValidationSnapshot | null>(null)
  const [message, setMessage] = useState('Waiting for live implementation data')

  const loadMatrix = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/system-monitoring/implementation-status', { cache: 'no-store' })
      const payload = (await response.json()) as ApiEnvelope<{ matrix: MatrixRow[] }>
      if (!response.ok || !payload.success) throw new Error(payload.message)
      setMatrixRows(payload.data.matrix)
      setMessage('Live implementation matrix loaded')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Live implementation data unavailable')
      setMatrixRows([])
    }
  }, [])

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadMatrix(), 0)
    const poll = window.setInterval(() => void loadMatrix(), 30000)
    return () => {
      clearTimeout(initialLoad)
      window.clearInterval(poll)
    }
  }, [loadMatrix])

  useEffect(() => {
    const stream = new EventSource('/api/v1/system-monitoring/validation-stream')
    const update = (event: Event) => {
      const snapshot = JSON.parse((event as MessageEvent).data) as ValidationSnapshot
      setValidation(snapshot)
      setMessage(snapshot.instance.currentStage ?? snapshot.instance.status)
      void loadMatrix()
    }
    ;['workflow.instance.created', 'workflow.started', 'workflow.stage.started', 'workflow.stage.progress', 'workflow.stage.completed', 'workflow.completed', 'workflow.failed'].forEach((eventName) => {
      stream.addEventListener(eventName, update)
    })
    return () => stream.close()
  }, [loadMatrix])

  const readiness = useMemo(() => {
    if (validation) return Math.round(validation.instance.progressPercent)
    if (matrixRows.length === 0) return 0
    return Math.round(matrixRows.reduce((sum, row) => sum + Number(row.health_percent ?? 0), 0) / matrixRows.length)
  }, [matrixRows, validation])
  const completed = matrixRows.filter((row) => String(row.status).toLowerCase() === 'completed').length
  const failed = matrixRows.filter((row) => String(row.status).toLowerCase() === 'failed').length
  const pending = matrixRows.length - completed - failed
  const modules = new Set(matrixRows.map((row) => row.module).filter(Boolean)).size
  const pages = new Set(matrixRows.map((row) => row.page).filter(Boolean)).size

  return (
    <div className="impl-dashboard">
      <header className="impl-topbar">
        <div className="impl-top-search">
          <Search size={17} />
          <span>Search live implementation data...</span>
          <kbd>DB</kbd>
        </div>
        <div className="impl-mini-avatar">DB</div>
      </header>

      <section className="impl-page-head">
        <div>
          <div className="impl-breadcrumb">System Monitoring <span>/</span> <b>Implementation Status</b></div>
          <h1>End-to-End Implementation Status <ShieldCheck size={22} /></h1>
          <p>{message}</p>
        </div>
      </section>

      <section className="impl-kpi-grid">
        {[
          { label: 'Modules', value: String(modules), note: 'Distinct database modules', tone: 'blue', Icon: Layers3 },
          { label: 'Pages', value: String(pages), note: 'Distinct database pages', tone: 'green', Icon: FileText },
          { label: 'Matrix Rows', value: String(matrixRows.length), note: 'implementation_linkage_matrix', tone: 'purple', Icon: Route },
          { label: 'Validation Steps', value: String(validation?.steps.length ?? 0), note: validation?.instance.status ?? 'No active run', tone: 'red', Icon: Bot },
          { label: 'Workflows', value: validation ? '1' : '0', note: 'Active validation workflow', tone: 'cyan', Icon: GitBranch },
        ].map(({ Icon, label, value, note, tone }) => (
          <article key={label} className="impl-kpi-card">
            <div className={`impl-kpi-icon ${tone}`}><Icon size={25} /></div>
            <div><span>{label}</span><b>{value}</b><small>{note}</small></div>
          </article>
        ))}
        <article className="impl-kpi-card ready">
          <div className="impl-ring small"><b>{readiness}%</b></div>
          <div><span>Final Output Ready</span><b>{readiness}%</b><small>Calculated from database rows</small></div>
        </article>
      </section>

      <section className="impl-pipeline-card">
        <h2>Validation Workflow Progress</h2>
        <div className="impl-pipeline-row">
          {(validation?.steps ?? []).map((step) => (
            <article key={step.id} className="impl-pipe-item">
              <div className="impl-pipe-bubble blue"><Database size={26} /></div>
              <h3>{step.stageName}</h3>
              <div className="impl-pipe-meta"><span>{step.status}</span><b>{Math.round(step.progressPercent)}%</b></div>
              <div className="impl-bar blue"><span style={{ width: `${step.progressPercent}%` }} /></div>
            </article>
          ))}
        </div>
        {!validation ? <p>No active validation workflow is currently running.</p> : null}
      </section>

      <div className="impl-main-grid">
        <section className="impl-matrix-card">
          <div className="impl-section-head">
            <h2>Implementation Linkage Matrix <CircleHelp size={14} /></h2>
            <div>
              <label><Search size={15} /><input placeholder="Search module or page..." /></label>
            </div>
          </div>
          <div className="impl-table-wrap">
            <table className="impl-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Page / Sub-module</th>
                  {checkColumns.map(([label]) => <th key={label}>{label}</th>)}
                  <th>Status</th>
                  <th>Health %</th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row, rowIndex) => (
                  <tr key={`${row.module}-${row.page}-${rowIndex}`}>
                    <td>{row.module ?? '-'}</td>
                    <td>{row.page ?? '-'}</td>
                    {checkColumns.map(([label, key]) => <td key={label}><StatusDot value={row[key]} /></td>)}
                    <td><span className={`impl-tag ${String(row.status ?? 'pending').toLowerCase().replace(' ', '-')}`}>{normalizeStatus(row.status)}</span></td>
                    <td>{Number(row.health_percent ?? 0)}%</td>
                  </tr>
                ))}
                {matrixRows.length === 0 ? <tr><td colSpan={checkColumns.length + 4}>No implementation linkage rows found in the database.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <div className="impl-table-footer">
            <span>Showing {matrixRows.length} database rows</span>
            <div className="impl-status-legend">
              <span><i className="completed" />Completed {completed}</span>
              <span><i className="pending" />Pending {pending}</span>
              <span><i className="failed" />Failed {failed}</span>
            </div>
          </div>
        </section>

        <aside className="impl-right-stack">
          <article className="impl-side-card">
            <h2>Implementation Health Score</h2>
            <div className="impl-health-layout">
              <div className="impl-ring large"><b>{readiness}%</b><span>Overall Health</span></div>
              <ul className="impl-health-list">
                <li><i className="completed" />Completed <b>{completed}</b></li>
                <li><i className="pending" />Pending <b>{pending}</b></li>
                <li><i className="failed" />Failed <b>{failed}</b></li>
              </ul>
            </div>
          </article>

          <article className="impl-side-card">
            <h2>Critical Blockers</h2>
            <div className="impl-list">
              {matrixRows.filter((row) => String(row.status).toLowerCase() === 'failed').map((row, index) => (
                <div key={`${row.module}-${row.page}-${index}`}>
                  <AlertCircle size={15} />
                  <p><b>{row.module ?? 'Unknown module'}</b><span>{row.page ?? 'No page linked'}</span></p>
                  <small>{Number(row.health_percent ?? 0)}%</small>
                </div>
              ))}
              {failed === 0 ? <p>No failed implementation rows found in the database.</p> : null}
            </div>
          </article>

          <article className="impl-side-card">
            <h2>Automation State</h2>
            <p>{validation ? `${Math.round(validation.instance.progressPercent)}% - ${message}` : message}</p>
          </article>
        </aside>
      </div>

      <section className="impl-bottom-grid">
        <article className="impl-side-card readiness">
          <h2>Final Output Readiness</h2>
          <div className="impl-ring large"><b>{readiness}%</b></div>
          <p>{validation?.instance.currentStage ?? 'Calculated from live database state'}</p>
        </article>
        <article className="impl-side-card output">
          <h2>Output Pipeline Flow</h2>
          <div className="impl-output-flow">
            {checkColumns.map(([label, key]) => {
              const ready = matrixRows.filter((row) => row[key] === true).length
              const percent = matrixRows.length ? Math.round((ready / matrixRows.length) * 100) : 0
              return (
                <div key={label}>
                  <span className="impl-output-icon blue"><Network size={24} /></span>
                  <b>{label}</b>
                  <small>{percent}%</small>
                </div>
              )
            })}
          </div>
        </article>
      </section>
    </div>
  )
}
