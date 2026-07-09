'use client'

import { AlertTriangle, Clock3, Download, Pause, Play, RefreshCw, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { backgroundJobsMockData, type Job, type JobPriority, type JobStatus, type QueueMetric, type Worker } from '@/data/backgroundJobsMockData'
import { ActionGuard } from '@/components/auth/ActionGuard'

const statusClass: Record<JobStatus, string> = {
  Completed: 'completed',
  Running: 'running',
  Queued: 'queued',
  Pending: 'pending',
  Failed: 'failed',
  Retrying: 'retrying',
  Cancelled: 'cancelled',
}

const priorityClass: Record<JobPriority, string> = {
  Critical: 'critical',
  High: 'high',
  Medium: 'medium',
  Low: 'low',
}

function placeholder(action: string, target?: string) {
  console.info(`[background-jobs] ${action}`, target ?? 'all jobs')
}

function JobProgress({ value, tone = 'running' }: { value: number; tone?: string }) {
  return <div className={`jobs-progress ${tone}`}><span style={{ width: `${value}%` }} /></div>
}

function PriorityBadge({ priority }: { priority: JobPriority }) {
  return <span className={`jobs-priority ${priorityClass[priority]}`}>{priority}</span>
}

function StatusBadge({ status }: { status: JobStatus }) {
  return <span className={`jobs-status ${statusClass[status]}`}>{status}</span>
}

function QueueCard({ queue }: { queue: QueueMetric }) {
  return (
    <article className="jobs-queue-card">
      <div className="jobs-card-head"><h3>{queue.name}</h3><b>{queue.health}%</b></div>
      <div className="jobs-queue-metrics">
        <span>Current Jobs <b>{queue.currentJobs}</b></span>
        <span>Workers <b>{queue.workers}</b></span>
        <span>Running <b>{queue.running}</b></span>
        <span>Queued <b>{queue.queued}</b></span>
        <span>Failed <b>{queue.failed}</b></span>
        <span>Avg Wait <b>{queue.averageWait}</b></span>
        <span>Throughput <b>{queue.throughput}</b></span>
      </div>
      <JobProgress value={queue.health} tone={queue.health > 94 ? 'completed' : queue.health > 88 ? 'pending' : 'failed'} />
    </article>
  )
}

function WorkerCard({ worker }: { worker: Worker }) {
  return (
    <article className="jobs-worker-card">
      <div className="jobs-card-head"><h3>{worker.name}</h3><b>{worker.health}%</b></div>
      <p>{worker.currentTask}</p>
      <div className="jobs-worker-bars">
        <span>Running Jobs <b>{worker.runningJobs}</b></span>
        <span>CPU <b>{worker.cpu}%</b></span><JobProgress value={worker.cpu} />
        <span>Memory <b>{worker.memory}%</b></span><JobProgress value={worker.memory} tone="retrying" />
      </div>
      <ActionGuard permission="system_monitoring.restart_service" mode="disable">
        <button type="button" onClick={() => placeholder('Restart Worker', worker.name)}>Restart Worker</button>
      </ActionGuard>
    </article>
  )
}

export function BackgroundJobsDashboard() {
  const [data, setData] = useState(backgroundJobsMockData)

  useEffect(() => {
    let mounted = true
    fetch('/api/system-monitoring/background-jobs', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: { data?: typeof backgroundJobsMockData }) => {
        if (mounted && payload.data) setData(payload.data)
      })
      .catch((error) => console.error('[background-jobs] API fallback active', error))

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="jobs-dashboard">
      <section className="jobs-page-head">
        <div>
          <div className="jobs-breadcrumb">System Monitoring <span>/</span> Background Jobs</div>
          <h1>Background Jobs</h1>
          <p>Monitor and manage every asynchronous task running across the AI Media Operating System.</p>
        </div>
        <div className="jobs-page-actions">
          <ActionGuard permission="system_monitoring.run_validation" mode="disable"><button type="button" onClick={() => placeholder('Run Scheduler')}><Play size={16} />Run Scheduler</button></ActionGuard>
          <ActionGuard permission="module.manage" mode="disable"><button type="button" onClick={() => placeholder('Pause Queue')}><Pause size={16} />Pause Queue</button></ActionGuard>
          <ActionGuard permission="module.manage" mode="disable"><button type="button" onClick={() => placeholder('Resume Queue')}><Play size={16} />Resume Queue</button></ActionGuard>
          <ActionGuard permission="system_monitoring.run_validation" mode="disable"><button type="button" onClick={() => placeholder('Retry Failed Jobs')}><RotateCcw size={16} />Retry Failed Jobs</button></ActionGuard>
          <ActionGuard permission="module.delete" mode="disable"><button type="button" onClick={() => placeholder('Clear Completed Jobs')}><Trash2 size={16} />Clear Completed Jobs</button></ActionGuard>
          <ActionGuard permission="system_monitoring.export_report" mode="disable"><button type="button" onClick={() => placeholder('Export Report')}><Download size={16} />Export Report</button></ActionGuard>
          <button type="button" className="jobs-primary-button" onClick={() => placeholder('Refresh')}><RefreshCw size={16} />Refresh</button>
        </div>
      </section>

      <section className="jobs-kpi-grid">
        {data.kpis.map(([label, value, note]) => <article key={label} className="jobs-kpi-card"><small>{label}</small><b>{value}</b><p>{note}</p></article>)}
      </section>

      <section className="jobs-filter-card">
        {['Global Job Search', 'Queue', 'Module', 'Worker', 'Priority', 'Status', 'Date Range', 'Owner'].map((filter) => (
          <label key={filter}><SlidersHorizontal size={14} />{filter}</label>
        ))}
      </section>

      <section className="jobs-layout-grid">
        <div className="jobs-main-stack">
          <Section title="Queue Status Overview" subtitle="Queue pressure, worker availability, wait time, and throughput.">
            <div className="jobs-queue-grid">{data.queues.map((queue) => <QueueCard key={queue.name} queue={queue} />)}</div>
          </Section>

          <Section title="Live Job Execution Timeline" subtitle="Current lifecycle stages for asynchronous execution.">
            <div className="jobs-timeline">{data.timeline.map((stage) => <div key={stage}><span /> <b>{stage}</b></div>)}</div>
          </Section>

          <JobTable title="Active Jobs Table" jobs={data.jobs} />

          <Section title="Failed Jobs" subtitle="Failure reason, retry plan, worker assignment, and resolution path.">
            <div className="jobs-table-wrap">
              <table className="jobs-table">
                <thead><tr>{['Job', 'Reason', 'Stack Trace Summary', 'Retries', 'Next Retry', 'Assigned Worker', 'Resolution', 'Retry Button', 'Open Logs'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
                <tbody>{data.failedJobs.map(([job, reason, trace, retries, nextRetry, worker, resolution]) => <tr key={String(job)}><td>{job}</td><td>{reason}</td><td>{trace}</td><td>{retries}</td><td>{nextRetry}</td><td>{worker}</td><td>{resolution}</td><td><ActionGuard permission="system_monitoring.run_validation" mode="disable"><button type="button" onClick={() => placeholder('Retry Job', String(job))}>Retry</button></ActionGuard></td><td><button type="button" onClick={() => placeholder('Open Logs', String(job))}>Logs</button></td></tr>)}</tbody>
              </table>
            </div>
          </Section>

          <Section title="Scheduled Jobs" subtitle="Recurring schedules and next execution windows.">
            <div className="jobs-table-wrap">
              <table className="jobs-table">
                <thead><tr>{['Job', 'Schedule', 'Next Run', 'Frequency', 'Module', 'Enabled', 'Owner', 'Status'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
                <tbody>{data.scheduledJobs.map(([job, schedule, nextRun, frequency, module, enabled, owner, status]) => <tr key={String(job)}><td>{job}</td><td>{schedule}</td><td>{nextRun}</td><td>{frequency}</td><td>{module}</td><td>{enabled ? 'Yes' : 'No'}</td><td>{owner}</td><td>{status}</td></tr>)}</tbody>
              </table>
            </div>
          </Section>

          <Section title="Worker Status" subtitle="Worker utilization, health, and current task assignment.">
            <div className="jobs-worker-grid">{data.workers.map((worker) => <WorkerCard key={worker.name} worker={worker} />)}</div>
          </Section>

          <Section title="Job Distribution" subtitle="Operational distribution across modules, queues, priorities, durations, and workers.">
            <div className="jobs-distribution-grid">{data.distributions.map(([title, rows]) => <DistributionCard key={title as string} title={title as string} rows={rows as [string, number][]} />)}</div>
          </Section>

          <Section title="Queue Dependency Map" subtitle="Content operations flow from generation through learning.">
            <div className="jobs-dependency-flow">{data.dependencyFlow.map((node) => <button type="button" key={node} onClick={() => placeholder('View Dependency Node', node)}>{node}</button>)}</div>
          </Section>
        </div>

        <aside className="jobs-side-panel">
          {Object.entries(data.rightPanel).map(([title, items]) => <SideList key={title} title={title} items={items} />)}
          <article className="jobs-card"><h2>Real-time Event Stream</h2>{data.events.map(([time, event]) => <p className="jobs-event" key={`${time}-${event}`}><Clock3 size={14} /><b>{time}</b>{event}</p>)}</article>
        </aside>
      </section>

      <section className="jobs-bottom-grid">{data.bottom.map(([title, ...items]) => <article key={title} className="jobs-card"><h2>{title}</h2>{items.map((item) => <p key={item}>{item}</p>)}</article>)}</section>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="jobs-card"><div className="jobs-section-head"><div><h2>{title}</h2><p>{subtitle}</p></div></div>{children}</section>
}

function JobTable({ title, jobs }: { title: string; jobs: Job[] }) {
  return (
    <Section title={title} subtitle="Live execution state with progress, priority, retries, and owners.">
      <div className="jobs-table-wrap">
        <table className="jobs-table active">
          <thead><tr>{['Job ID', 'Job Name', 'Module', 'Queue', 'Priority', 'Status', 'Worker', 'Progress %', 'Execution Time', 'Started', 'ETA', 'Retries', 'Owner', 'Action'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
          <tbody>{jobs.map((job) => <tr key={job.id}><td>{job.id}</td><td>{job.name}</td><td>{job.module}</td><td>{job.queue}</td><td><PriorityBadge priority={job.priority} /></td><td><StatusBadge status={job.status} /></td><td>{job.worker}</td><td><JobProgress value={job.progress} tone={statusClass[job.status]} /></td><td>{job.executionTime}</td><td>{job.started}</td><td>{job.eta}</td><td>{job.retries}</td><td>{job.owner}</td><td><button type="button" onClick={() => placeholder('View Details', job.id)}>Actions</button></td></tr>)}</tbody>
        </table>
      </div>
    </Section>
  )
}

function DistributionCard({ title, rows }: { title: string; rows: [string, number][] }) {
  return <article className="jobs-distribution-card"><h3>{title}</h3>{rows.map(([label, value]) => <p key={label}><span>{label}</span><b>{value}%</b><JobProgress value={value} /></p>)}</article>
}

function SideList({ title, items }: { title: string; items: string[] }) {
  return <article className="jobs-card jobs-side-card"><h2>{title.replace(/([A-Z])/g, ' $1')}</h2>{items.map((item) => <p key={item}><AlertTriangle size={14} />{item}</p>)}</article>
}
