'use client'

import {
  BarChart3,
  Bot,
  CalendarDays,
  Clock3,
  FileText,
  Play,
  Square,
  Search,
  Send,
  Sparkles,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type WorkflowStepState = {
  id: string
  stageName: string
  status: string
  progressPercent: number
}

type WorkflowInstanceState = {
  id: string
  workflowCode: string
  workflowName: string
  status: string
  progressPercent: number
  currentStage?: string | null
  startedAt?: string | null
  createdAt?: string | null
}

type WorkflowSnapshot = {
  instance: WorkflowInstanceState
  steps: WorkflowStepState[]
  logs: { message: string; createdAt: string }[]
}

type SystemStatus = {
  status?: string
  healthPercent?: number
  health_percent?: number
  readinessPercent?: number
  readiness_percent?: number
  currentStage?: string | null
  current_stage?: string | null
  updatedAt?: string | null
  updated_at?: string | null
  activeInstance?: WorkflowInstanceState | null
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

const quickActions = [
  ['Create Content', FileText],
  ['Research Topic', Search],
  ['Generate Script', Sparkles],
  ['Create Video', Video],
  ['Schedule Content', CalendarDays],
  ['View Analytics', BarChart3],
  ['AI Agent Chat', Bot],
] as const

const nigeriaTimeZone = 'Africa/Lagos'
const activeWorkflowStatuses = ['queued', 'starting', 'running', 'paused', 'stopping']

function isActiveWorkflowStatus(status?: string | null) {
  return activeWorkflowStatuses.includes(String(status ?? '').toLowerCase())
}

function formatTime(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-NG', { timeZone: nigeriaTimeZone, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value))
}

export function LandingDashboard() {
  const [startup, setStartup] = useState<WorkflowSnapshot | null>(null)
  const [instances, setInstances] = useState<WorkflowInstanceState[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [message, setMessage] = useState('Waiting for live database data')
  const [now, setNow] = useState<number | null>(null)

  const startupSteps = useMemo(() => startup?.steps ?? [], [startup])

  const loadLiveData = useCallback(async () => {
    try {
      const [statusResponse, instancesResponse] = await Promise.all([
        fetch('/api/v1/system/status', { cache: 'no-store' }),
        fetch('/api/v1/workflows/instances', { cache: 'no-store' }),
      ])
      const statusPayload = (await statusResponse.json()) as ApiEnvelope<SystemStatus>
      const instancesPayload = (await instancesResponse.json()) as ApiEnvelope<WorkflowInstanceState[]>

      if (!statusResponse.ok || !statusPayload.success) throw new Error(statusPayload.message)
      if (!instancesResponse.ok || !instancesPayload.success) throw new Error(instancesPayload.message)

      setSystemStatus(statusPayload.data)
      setInstances(instancesPayload.data)
      const activeStartup = instancesPayload.data.find((instance) => instance.workflowCode === 'SYSTEM_STARTUP' && isActiveWorkflowStatus(instance.status))
      const latestStartup = instancesPayload.data.find((instance) => instance.workflowCode === 'SYSTEM_STARTUP')
      const startupReference = activeStartup ?? latestStartup
      if (startupReference) {
        const snapshotResponse = await fetch(`/api/v1/workflows/instances/${startupReference.id}`, { cache: 'no-store' })
        const snapshotPayload = (await snapshotResponse.json()) as ApiEnvelope<WorkflowSnapshot>
        if (snapshotResponse.ok && snapshotPayload.success) setStartup(snapshotPayload.data)
      } else {
        setStartup(null)
      }
      setMessage('Live database data loaded')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Live database data unavailable')
    }
  }, [])

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadLiveData(), 0)
    const initialClock = setTimeout(() => setNow(Date.now()), 0)
    const clock = setInterval(() => setNow(Date.now()), 1000)
    const poll = setInterval(() => void loadLiveData(), 5000)
    const stream = new EventSource('/api/v1/system/startup-stream')
    const update = (event: Event) => {
      const snapshot = JSON.parse((event as MessageEvent).data) as WorkflowSnapshot
      setStartup(snapshot)
      setMessage(snapshot.instance.currentStage ?? snapshot.instance.status)
      void loadLiveData()
    }
    ;['workflow.instance.created', 'workflow.started', 'workflow.stage.started', 'workflow.stage.progress', 'workflow.stage.completed', 'workflow.completed', 'workflow.paused', 'workflow.resumed', 'workflow.cancelled', 'workflow.failed'].forEach((eventName) => {
      stream.addEventListener(eventName, update)
    })
    return () => {
      clearInterval(clock)
      clearInterval(poll)
      clearTimeout(initialLoad)
      clearTimeout(initialClock)
      stream.close()
    }
  }, [loadLiveData])

  async function runAction(action: 'start' | 'stop') {
    const response = await fetch(`/api/v1/system/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ requestedBy: 'dashboard' }),
    })
    const payload = (await response.json()) as ApiEnvelope<WorkflowSnapshot>
    if (!response.ok || !payload.success) {
      setMessage(payload.message ?? 'Live workflow operation failed.')
      return
    }
    setStartup(payload.data)
    setMessage(payload.message)
    await loadLiveData()
  }

  const systemState = String(systemStatus?.status ?? '').toLowerCase()
  const statusActiveInstance = systemStatus?.activeInstance && isActiveWorkflowStatus(systemStatus.activeInstance.status) ? systemStatus.activeInstance : null
  const startupActiveInstance = startup?.instance && isActiveWorkflowStatus(startup.instance.status) ? startup.instance : null
  const activeInstance = statusActiveInstance ?? startupActiveInstance ?? null
  const systemIsStopped = ['stopped', 'shutdown', 'offline'].includes(systemState)
  const systemIsRunning = ['operational', 'starting', 'running', 'stopping'].includes(systemState) || Boolean(activeInstance)
  const toggleAction = systemIsRunning ? 'stop' : 'start'
  const ToggleIcon = systemIsRunning ? Square : Play
  const systemHealthPercent = Math.round(Number(systemStatus?.healthPercent ?? systemStatus?.health_percent ?? 0))
  const systemReadinessPercent = Math.round(Number(systemStatus?.readinessPercent ?? systemStatus?.readiness_percent ?? 0))
  const systemCurrentStage = systemStatus?.currentStage ?? systemStatus?.current_stage ?? null
  const lastRuntimeUpdate = systemStatus?.updatedAt ?? systemStatus?.updated_at ?? activeInstance?.createdAt ?? null
  const overallProgress = systemIsStopped ? 0 : Math.round(activeInstance?.progressPercent ?? systemReadinessPercent)
  const displayStartupSteps = systemIsStopped
    ? startupSteps.map((step) => ({ ...step, status: 'idle', progressPercent: 0 }))
    : startupSteps
  const startupStatusMessage = activeInstance?.workflowCode === 'SYSTEM_STARTUP'
    ? (activeInstance.currentStage ?? message)
    : systemIsStopped
      ? 'No active startup workflow'
      : (systemCurrentStage ?? 'System operational')
  const startedAt = activeInstance?.startedAt ? new Date(activeInstance.startedAt).getTime() : null
  const elapsedSeconds = startedAt && now ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0
  const elapsed = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`
  const completedWorkflows = instances.filter((instance) => instance.status === 'completed').length
  const runningWorkflows = instances.filter((instance) => ['queued', 'running', 'paused'].includes(instance.status)).length
  const failedWorkflows = instances.filter((instance) => instance.status === 'failed').length
  const workflowStatusSummary = [
    ['Completed', completedWorkflows],
    ['Running', runningWorkflows],
    ['Failed', failedWorkflows],
    ['Total', instances.length],
  ] as const
  const systemWorkflowRows = instances.filter((instance) => instance.workflowCode.startsWith('SYSTEM_')).slice(0, 5)
  const liveMetrics: { label: string; value: string; note: string; Icon: LucideIcon; tone: string }[] = [
    { label: 'Workflow Instances', value: String(instances.length), note: 'Rows from workflow_instances', Icon: FileText, tone: 'purple' },
    { label: 'Completed', value: String(completedWorkflows), note: 'Completed workflow instances', Icon: Send, tone: 'green' },
    { label: 'Running', value: String(runningWorkflows), note: 'Queued/running/paused instances', Icon: Sparkles, tone: 'orange' },
    { label: 'Failed', value: String(failedWorkflows), note: 'Failed workflow instances', Icon: BarChart3, tone: 'blue' },
    { label: 'Current Progress', value: `${overallProgress}%`, note: activeInstance?.workflowName ?? (systemIsStopped ? 'System stopped' : 'System operational'), Icon: Bot, tone: 'pink' },
  ]

  return (
    <div className="landing-dashboard">
      <header className="landing-topbar">
        <div>
          <h1>CACSMS Contents</h1>
          <p>Live production dashboard</p>
        </div>
        <div className="landing-search">
          <Search size={18} />
          <span>Search live modules, content, workflows...</span>
        </div>
        <div className="landing-service-actions">
          <button type="button" className={systemIsRunning ? 'stop' : 'start'} onClick={() => runAction(toggleAction)}>
            <ToggleIcon size={15} />{systemIsRunning ? 'Stop' : 'Start'}
          </button>
        </div>
        <div className="landing-date-row">
          <span><CalendarDays size={15} />{now ? new Intl.DateTimeFormat('en-NG', { timeZone: nigeriaTimeZone, dateStyle: 'medium' }).format(new Date(now)) : 'Loading Nigeria date'}</span>
          <span><Clock3 size={15} />{now ? new Intl.DateTimeFormat('en-NG', { timeZone: nigeriaTimeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }).format(new Date(now)) : 'Loading Nigeria time'}</span>
        </div>
      </header>

      <section className="landing-hero-grid">
        <article className="landing-card landing-status-card">
          <div className="landing-card-head">
            <h2>System Overall Status</h2>
            <span>{systemStatus?.status ?? 'Database unavailable'}</span>
          </div>
          <div className="landing-status-body">
            <div className="landing-health-ring"><b>{systemIsStopped ? 0 : systemHealthPercent}%</b><small>Health</small></div>
            <div className="landing-checks">
              <p><i />Readiness<b>{systemIsStopped ? 0 : systemReadinessPercent}%</b></p>
              <p><i />Active Workflow<b>{activeInstance?.workflowName ?? 'None'}</b></p>
              <p><i />Current Stage<b>{activeInstance?.currentStage ?? systemCurrentStage ?? '-'}</b></p>
              <p><i />Last Update<b>{formatTime(lastRuntimeUpdate)}</b></p>
            </div>
          </div>
          <footer><span>{message}</span><span>Autonomous service mode</span></footer>
        </article>

        {liveMetrics.map(({ label, value, note, Icon, tone }) => (
          <article key={label} className={`landing-metric-card ${tone}`}>
            <span><Icon size={22} /></span>
            <small>{label}</small>
            <h2>{value}</h2>
            <p>{note}</p>
          </article>
        ))}
      </section>

      <section className="landing-startup-layout">
        <article className="landing-card landing-startup">
          <div className="landing-card-head">
            <div><h2>System Startup Sequence</h2><p>Live stages from workflow_instance_steps</p></div>
            <div className="landing-startup-actions"><span>Elapsed Time: {elapsed}</span></div>
          </div>
          <div className="landing-startup-steps">
            {displayStartupSteps.length === 0 ? (
              <article className="landing-step idle"><b>0</b><h3>No active startup workflow</h3><p>{message}</p><strong>0%</strong><div><i style={{ width: '0%' }} /></div></article>
            ) : displayStartupSteps.map((step, index) => {
              const state = step.status === 'completed' ? 'complete' : step.status === 'running' ? 'active' : step.status === 'failed' ? 'warning' : 'idle'
              return (
                <article key={step.id} className={`landing-step ${state}`}>
                  <b>{index + 1}</b>
                  <h3>{step.stageName}</h3>
                  <p>{step.status}</p>
                  <strong>{Math.round(step.progressPercent)}%</strong>
                  <div><i style={{ width: `${step.progressPercent}%` }} /></div>
                  <em>{state === 'complete' ? '\u2713' : ''}</em>
                </article>
              )
            })}
          </div>
          <div className="landing-overall"><span>Overall Startup Progress</span><div><i style={{ width: `${overallProgress}%` }} /></div><b>{overallProgress}%</b><small>{startupStatusMessage}</small></div>
        </article>

        <article className="landing-card landing-details">
          <h2>Startup Details</h2>
          {displayStartupSteps.length === 0 ? <p><i className="idle" />No database-backed startup steps<b>Idle</b><span>0%</span></p> : displayStartupSteps.map((step) => (
            <p key={step.id}><i className={step.status === 'completed' ? 'complete' : step.status === 'running' ? 'active' : 'idle'} />{step.stageName}<b>{step.status}</b><span>{Math.round(step.progressPercent)}%</span></p>
          ))}
          <div className="landing-toggle">Live database mode<span /></div>
        </article>
      </section>

      <section className="landing-middle-grid">
        <article className="landing-card landing-quick">
          <h2>Autonomous Queues</h2><p>Service-managed workflow capabilities</p>
          <div>{quickActions.map(([label, Icon]) => <span key={label}><Icon size={25} />{label}</span>)}</div>
        </article>
        <article className="landing-card landing-pipeline">
          <div className="landing-card-head"><div><h2>Workflow Instances</h2><p>Latest rows from the workflow database</p></div></div>
          <div className="landing-pipe-items">
            {instances.slice(0, 8).map((instance) => (
              <div key={instance.id} className="blue"><Video size={28} /><b>{Math.round(instance.progressPercent)}%</b><span>{instance.workflowName}</span><small>{instance.status}</small></div>
            ))}
          </div>
          {instances.length === 0 ? <p>No workflow instances found in the database.</p> : null}
        </article>
        <article className="landing-card landing-controls">
          <h2>System State</h2><p>Live workflow execution state</p>
          <ul>
            <li>System Status<span>{systemStatus?.status ?? 'Unavailable'}</span></li>
            <li>Active Workflow<span>{activeInstance?.status ?? 'None'}</span></li>
            <li>Readiness<span>{systemIsStopped ? 0 : systemReadinessPercent}%</span></li>
            <li>Workflow Count<span>{instances.length}</span></li>
          </ul>
        </article>
      </section>

      <section className="landing-bottom-grid">
        <article className="landing-card landing-controls"><h2>Workflow Status Summary</h2><p>Live counts from workflow_instances</p><ul>{workflowStatusSummary.map(([label, value]) => <li key={label}>{label}<span>{value}</span></li>)}</ul></article>
        <article className="landing-card landing-workflows"><h2>Recent Workflows</h2><p>Live workflow_instances rows</p>{instances.slice(0, 5).map((instance) => <div key={instance.id}><span>{instance.workflowName}</span><b className={instance.status === 'completed' ? 'complete' : 'progress'}>{instance.status}</b><small>{formatTime(instance.createdAt)}</small></div>)}</article>
        <article className="landing-card landing-workflows"><h2>System Workflows</h2><p>Live SYSTEM_* workflow rows</p>{systemWorkflowRows.length ? systemWorkflowRows.map((instance) => <div key={instance.id}><span>{instance.workflowName}</span><b className={instance.status === 'completed' ? 'complete' : 'progress'}>{instance.status}</b><small>{formatTime(instance.createdAt)}</small></div>) : <p>No system workflow rows found in the database.</p>}</article>
        <article className="landing-card landing-feed"><h2>System Activity Feed</h2>{startup?.logs.slice(0, 5).map((log) => <p key={`${log.createdAt}-${log.message}`}>{formatTime(log.createdAt)} - {log.message}</p>) ?? <p>No workflow logs loaded from the database.</p>}</article>
      </section>
    </div>
  )
}
