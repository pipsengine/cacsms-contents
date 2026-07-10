'use client'

import {
  BarChart3,
  Brain,
  CalendarDays,
  Database,
  FileText,
  Lightbulb,
  Network,
  PenLine,
  Plane,
  ShieldCheck,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type StageTone = 'purple' | 'blue' | 'indigo' | 'orange' | 'teal' | 'green' | 'violet' | 'pink'

type WorkflowInstance = {
  id: string
  workflowCode: string
  workflowName: string
  status: string
  progressPercent: number
  currentStage?: string | null
  createdAt?: string | null
}

type WorkflowStep = {
  id: string
  stageName: string
  status: string
  progressPercent: number
}

type WorkflowSnapshot = {
  instance: WorkflowInstance
  steps: WorkflowStep[]
  logs: { message: string; createdAt: string }[]
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

const stageIcons: [LucideIcon, StageTone][] = [
  [Lightbulb, 'purple'],
  [Target, 'blue'],
  [PenLine, 'indigo'],
  [ShieldCheck, 'orange'],
  [CalendarDays, 'teal'],
  [Plane, 'green'],
  [BarChart3, 'violet'],
  [Brain, 'pink'],
]

const systemFlowItems: { title: string; copy: string; Icon: LucideIcon; tone: StageTone }[] = [
  { title: 'Workflow Definitions', copy: 'workflow_definitions', Icon: Database, tone: 'purple' },
  { title: 'Instances', copy: 'workflow_instances', Icon: FileText, tone: 'blue' },
  { title: 'Stage Steps', copy: 'workflow_instance_steps', Icon: ShieldCheck, tone: 'orange' },
  { title: 'Jobs', copy: 'background_jobs', Icon: Network, tone: 'green' },
]

function toneFor(index: number) {
  return stageIcons[index % stageIcons.length]
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

const activeWorkflowStatuses = new Set(['queued', 'starting', 'running', 'paused', 'stopping'])
const terminalWorkflowStatuses = new Set(['completed', 'failed', 'cancelled', 'stopped'])

function isActiveWorkflow(instance: WorkflowInstance) {
  return activeWorkflowStatuses.has(instance.status)
}

function formatStatus(value?: string | null) {
  if (!value) return 'No status'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function WorkflowStatusDashboard() {
  const [instances, setInstances] = useState<WorkflowInstance[]>([])
  const [snapshot, setSnapshot] = useState<WorkflowSnapshot | null>(null)
  const [workflowMessage, setWorkflowMessage] = useState('Waiting for live workflow data')

  const loadSnapshot = useCallback(async (instanceId: string) => {
    const response = await fetch(`/api/v1/workflows/instances/${instanceId}`, { cache: 'no-store' })
    const payload = (await response.json()) as ApiEnvelope<WorkflowSnapshot>
    if (!response.ok || !payload.success) throw new Error(payload.message)
    setSnapshot(payload.data)
  }, [])

  const loadInstances = useCallback(async (options?: { preserveSelectedId?: string }) => {
    try {
      const response = await fetch('/api/v1/workflows/instances', { cache: 'no-store' })
      const payload = (await response.json()) as ApiEnvelope<WorkflowInstance[]>
      if (!response.ok || !payload.success) throw new Error(payload.message)
      setInstances(payload.data)
      const activeContentWorkflow = payload.data.find((item) => item.workflowCode === 'CONTENT_LIFECYCLE' && isActiveWorkflow(item))
      const activeWorkflow = activeContentWorkflow ?? payload.data.find(isActiveWorkflow)
      if (activeWorkflow) {
        await loadSnapshot(activeWorkflow.id)
        setWorkflowMessage('Active workflow instance loaded')
        return
      }
      const selectedHistory = options?.preserveSelectedId ? payload.data.find((item) => item.id === options.preserveSelectedId) : null
      if (selectedHistory) {
        await loadSnapshot(selectedHistory.id)
        setWorkflowMessage('Workflow completed. Final database snapshot is selected for review.')
        return
      }
      setSnapshot(null)
      setWorkflowMessage(payload.data.length ? 'No active workflow is running. Recent completed runs are shown as history.' : 'No workflow instances found in the database.')
    } catch (error) {
      setWorkflowMessage(error instanceof Error ? error.message : 'Live workflow data unavailable')
      setInstances([])
      setSnapshot(null)
    }
  }, [loadSnapshot])

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadInstances(), 0)
    return () => clearTimeout(initialLoad)
  }, [loadInstances])

  useEffect(() => {
    if (!snapshot?.instance.id) return
    const stream = new EventSource(`/api/v1/workflows/instances/${snapshot.instance.id}/stream`)
    const update = (event: Event) => {
      const nextSnapshot = JSON.parse((event as MessageEvent).data) as WorkflowSnapshot
      setSnapshot(nextSnapshot)
      setWorkflowMessage(nextSnapshot.instance.currentStage ?? nextSnapshot.instance.status)
      void loadInstances({ preserveSelectedId: nextSnapshot.instance.id })
    }
    ;['workflow.snapshot', 'workflow.started', 'workflow.stage.started', 'workflow.stage.progress', 'workflow.stage.completed', 'workflow.completed', 'workflow.failed', 'workflow.cancelled', 'workflow.stopped'].forEach((eventName) => {
      stream.addEventListener(eventName, update)
    })
    return () => stream.close()
  }, [loadInstances, snapshot?.instance.id])

  useEffect(() => {
    const poll = window.setInterval(() => void loadInstances({ preserveSelectedId: snapshot?.instance.id }), 5000)
    return () => window.clearInterval(poll)
  }, [loadInstances, snapshot?.instance.id])

  const steps = snapshot?.steps ?? []
  const selectedIsHistorical = snapshot ? terminalWorkflowStatuses.has(snapshot.instance.status) : false
  const completed = instances.filter((instance) => instance.status === 'completed').length
  const running = instances.filter(isActiveWorkflow).length
  const failed = instances.filter((instance) => instance.status === 'failed').length
  const overviewStats = useMemo(() => {
    const total = Math.max(instances.length, 1)
    return [
      ['Completed', `${completed} (${Math.round((completed / total) * 100)}%)`, 'green'],
      ['Active', `${running} (${Math.round((running / total) * 100)}%)`, 'blue'],
      ['Failed', `${failed} (${Math.round((failed / total) * 100)}%)`, 'red'],
    ]
  }, [completed, failed, instances.length, running])

  return (
    <div className="workflow-dashboard">
      <header className="workflow-header">
        <div>
          <h2>End-to-End Workflow Status</h2>
          <p>{workflowMessage}</p>
        </div>
      </header>

      {snapshot ? (
        <section className="workflow-timeline" aria-label="Workflow stages">
          <div className="workflow-timeline-line" />
          {steps.map((step, index) => {
            const [Icon, tone] = toneFor(index)
            return (
              <div key={step.id} className={`workflow-stage-icon ${tone}`} title={step.stageName}>
                <Icon size={26} />
              </div>
            )
          })}
        </section>
      ) : (
        <section className="workflow-empty-state">
          <h3>No active workflow is currently running</h3>
          <p>The completed rows in the database are historical workflow executions. Live stage progress appears here automatically when the system starts an active workflow.</p>
        </section>
      )}

      {selectedIsHistorical ? (
        <section className="workflow-history-banner">
          <b>Historical workflow selected</b>
          <span>This completed run is shown for audit review only. It is not an active live workflow.</span>
        </section>
      ) : null}

      <section className="workflow-summary-grid">
        {!snapshot ? (
          <article className="workflow-summary-card blue">
            <div className="workflow-card-title-row">
              <span className="workflow-stage-number">0</span>
              <h3>No Active Run</h3>
            </div>
            <p>Database contains no queued or running workflow instance.</p>
          </article>
        ) : steps.length === 0 ? (
          <article className="workflow-summary-card blue">
            <div className="workflow-card-title-row">
              <span className="workflow-stage-number">0</span>
              <h3>No Stage Rows</h3>
            </div>
            <p>The selected workflow instance has no database stage rows.</p>
          </article>
        ) : steps.map((step, index) => {
          const [, tone] = toneFor(index)
          return (
            <article key={step.id} className={`workflow-summary-card ${tone}`}>
              <div className="workflow-card-title-row">
                <span className="workflow-stage-number">{index + 1}</span>
                <h3>{step.stageName}</h3>
              </div>
              <div className="workflow-summary-stats">
                <b>{formatStatus(step.status)}</b>
                <b>{Math.round(step.progressPercent)}%</b>
              </div>
              <div className="workflow-progress thin">
                <span style={{ width: `${step.progressPercent}%` }} />
              </div>
              <p>Live row from workflow_instance_steps.</p>
            </article>
          )
        })}
      </section>

      {snapshot ? (
        <section className="workflow-stage-rail" aria-label="Workflow stage labels">
          {steps.map((step, index) => {
            const [, tone] = toneFor(index)
            return (
              <div key={step.id} className={`workflow-detail-label ${tone}`}>
                <span>{index + 1}</span>
                {step.stageName.toUpperCase()}
              </div>
            )
          })}
        </section>
      ) : null}

      <section className="workflow-detail-grid">
        <article className="workflow-work-card purple">
          <p className="workflow-field-label">Selected Workflow</p>
          <h3>{snapshot?.instance.workflowName ?? 'No workflow selected'}</h3>
          <span className={`workflow-pill ${selectedIsHistorical ? 'neutral' : 'success'}`}>{formatStatus(snapshot?.instance.status)}</span>
          <div className="workflow-score">
            <span>Progress</span>
            <b>{Math.round(snapshot?.instance.progressPercent ?? 0)}%</b>
          </div>
          <p><b>Current Stage</b><span>{snapshot?.instance.currentStage ?? '-'}</span></p>
          <p><b>Created</b><span>{formatDate(snapshot?.instance.createdAt)}</span></p>
        </article>

        <article className="workflow-work-card orange">
          <p className="workflow-field-label">Automation Policy</p>
          <h3 className="workflow-warning-title">Autonomous execution enabled</h3>
          <ul className="workflow-checklist">
            <li>AI stages continue automatically <b>On</b></li>
            <li>Approval gates bypassed <b>On</b></li>
            <li>Audit trail persisted <b>On</b></li>
          </ul>
          <p>{workflowMessage}</p>
        </article>

        <article className="workflow-work-card green">
          <p className="workflow-field-label">Workflow Instances</p>
          <h3>{instances.length} live rows</h3>
          <ul className="workflow-platforms">
            {instances.slice(0, 7).map((instance) => (
              <li key={instance.id}>
                <span>{instance.workflowName}</span><b>{formatStatus(instance.status)}</b>
              </li>
            ))}
          </ul>
        </article>

        <article className="workflow-work-card violet">
          <p className="workflow-field-label">Workflow Logs</p>
          <h3>Latest database execution logs</h3>
          {(snapshot?.logs ?? []).slice(0, 5).map((log) => (
            <div key={`${log.createdAt}-${log.message}`} className="workflow-metric"><div><b>{formatDate(log.createdAt)}</b><span>{log.message}</span></div></div>
          ))}
          {!snapshot?.logs.length ? <p>No logs found for the selected workflow instance.</p> : null}
        </article>
      </section>

      <section className="workflow-bottom-grid">
        <article className="workflow-panel workflow-overview-panel">
          <h3>Workflow Overview</h3>
          <div className="workflow-overview-body">
            <div className="workflow-donut"><b>{instances.length}</b><span>Total Workflows</span></div>
            <ul>{overviewStats.map(([label, value, tone]) => <li key={label}><span className={`legend-dot ${tone}`} />{label}<b>{value}</b></li>)}</ul>
          </div>
        </article>

        <div className="workflow-middle-stack">
          <article className="workflow-panel">
            <div className="workflow-agent-flow">
              {instances.slice(0, 7).map((instance, index) => {
                const [Icon, tone] = toneFor(index)
                return (
                  <div key={instance.id} className="workflow-agent-node">
                    <span className={`workflow-agent-icon ${tone}`}><Icon size={20} /></span>
                    <b>{instance.workflowName}</b>
                    <small>{formatStatus(instance.status)}</small>
                  </div>
                )
              })}
            </div>
          </article>
          <article className="workflow-panel">
            <h3>System Flow</h3>
            <div className="workflow-system-flow">
              {systemFlowItems.map(({ title, copy, Icon, tone }) => (
                <div key={title}>
                  <span className={`workflow-system-icon ${tone}`}>
                    <Icon size={18} />
                  </span>
                  <b>{title}</b>
                  <small>{copy}</small>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className="workflow-panel workflow-health-panel">
          <h3>Workflow Health</h3>
          <div className="workflow-health">{instances.length ? Math.round((completed / instances.length) * 100) : 0}%</div>
          <ul>
            <li><span className="legend-dot green" />Completed <b>{completed}</b></li>
            <li><span className="legend-dot orange" />Active <b>{running}</b></li>
            <li><span className="legend-dot red" />Failed <b>{failed}</b></li>
          </ul>
        </article>
      </section>

      <footer className="workflow-footer">
        <div><b>Status Legend</b><span className="legend-dot green" />Completed<span className="legend-dot blue" />Running<span className="legend-dot orange" />Pending<span className="legend-dot red" />Failed</div>
        <div><b>CACSMS Contents</b><span>Live workflow database mode</span></div>
      </footer>
    </div>
  )
}
