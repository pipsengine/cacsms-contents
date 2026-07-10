'use client'

import { AlertTriangle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type JobPriority = 'Critical' | 'High' | 'Medium' | 'Low'
type JobStatus = 'Completed' | 'Running' | 'Queued' | 'Pending' | 'Failed' | 'Retrying' | 'Cancelled'

type Job = {
  id: string
  name: string
  module?: string | null
  queue: string
  priority: JobPriority
  status: JobStatus
  worker?: string | null
  progress: number
  executionTime?: string | null
  started?: string | null
  eta?: string | null
  retries?: number | null
  owner?: string | null
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

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

function JobProgress({ value, tone = 'running' }: { value: number; tone?: string }) {
  return <div className={`jobs-progress ${tone}`}><span style={{ width: `${value}%` }} /></div>
}

function PriorityBadge({ priority }: { priority: JobPriority }) {
  return <span className={`jobs-priority ${priorityClass[priority]}`}>{priority}</span>
}

function StatusBadge({ status }: { status: JobStatus }) {
  return <span className={`jobs-status ${statusClass[status]}`}>{status}</span>
}

export function BackgroundJobsDashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [message, setMessage] = useState('Waiting for live background job data')

  const loadData = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/system-monitoring/background-jobs', { cache: 'no-store' })
      const payload = (await response.json()) as ApiEnvelope<{ jobs: Job[] }>
      if (!response.ok || !payload.success) throw new Error(payload.message)
      setJobs(payload.data.jobs)
      setMessage('Live background job data loaded')
    } catch (error) {
      setJobs([])
      setMessage(error instanceof Error ? error.message : 'Live background job data unavailable')
    }
  }, [])

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadData(), 0)
    const poll = window.setInterval(() => void loadData(), 10000)
    return () => {
      clearTimeout(initialLoad)
      window.clearInterval(poll)
    }
  }, [loadData])

  const stats = useMemo(() => {
    const completed = jobs.filter((job) => job.status === 'Completed').length
    const running = jobs.filter((job) => job.status === 'Running').length
    const queued = jobs.filter((job) => job.status === 'Queued').length
    const failed = jobs.filter((job) => job.status === 'Failed').length
    return { completed, running, queued, failed }
  }, [jobs])

  return (
    <div className="jobs-dashboard">
      <section className="jobs-page-head">
        <div>
          <div className="jobs-breadcrumb">System Monitoring <span>/</span> Background Jobs</div>
          <h1>Background Jobs</h1>
          <p>{message}</p>
        </div>
      </section>

      <section className="jobs-kpi-grid">
        {[
          ['Jobs', jobs.length, 'Rows from background_jobs'],
          ['Running', stats.running, 'Live running jobs'],
          ['Queued', stats.queued, 'Live queued jobs'],
          ['Completed', stats.completed, 'Live completed jobs'],
          ['Failed', stats.failed, 'Live failed jobs'],
        ].map(([label, value, note]) => <article key={String(label)} className="jobs-kpi-card"><small>{label}</small><b>{value}</b><p>{note}</p></article>)}
      </section>

      <section className="jobs-layout-grid">
        <div className="jobs-main-stack">
          <section className="jobs-card">
            <div className="jobs-section-head"><div><h2>Active Jobs Table</h2><p>Live execution state from the production database.</p></div></div>
            <div className="jobs-table-wrap">
              <table className="jobs-table active">
                <thead><tr>{['Job ID', 'Job Name', 'Module', 'Queue', 'Priority', 'Status', 'Worker', 'Progress %', 'Started', 'Retries', 'Owner'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
                <tbody>
                  {jobs.map((job) => <tr key={job.id}><td>{job.id}</td><td>{job.name}</td><td>{job.module ?? '-'}</td><td>{job.queue}</td><td><PriorityBadge priority={job.priority} /></td><td><StatusBadge status={job.status} /></td><td>{job.worker ?? '-'}</td><td><JobProgress value={job.progress} tone={statusClass[job.status]} /></td><td>{job.started ?? '-'}</td><td>{job.retries ?? '-'}</td><td>{job.owner ?? '-'}</td></tr>)}
                  {jobs.length === 0 ? <tr><td colSpan={11}>No background job rows found in the database.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="jobs-side-panel">
          <article className="jobs-card jobs-side-card"><h2>Live Data Status</h2><p><AlertTriangle size={14} />{message}</p></article>
        </aside>
      </section>
    </div>
  )
}
