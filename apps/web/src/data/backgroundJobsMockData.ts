export type JobStatus = 'Completed' | 'Running' | 'Queued' | 'Pending' | 'Failed' | 'Retrying' | 'Cancelled'
export type JobPriority = 'Critical' | 'High' | 'Medium' | 'Low'

export type QueueMetric = {
  name: string
  currentJobs: number
  workers: number
  running: number
  queued: number
  failed: number
  averageWait: string
  throughput: string
  health: number
}

export type Worker = {
  name: string
  runningJobs: number
  cpu: number
  memory: number
  health: number
  currentTask: string
}

export type Job = {
  id: string
  name: string
  module: string
  queue: string
  priority: JobPriority
  status: JobStatus
  worker: string
  progress: number
  executionTime: string
  started: string
  eta: string
  retries: number
  owner: string
}

export const backgroundJobsMockData = {
  kpis: [
    ['Total Jobs', '18,462', 'All queues'],
    ['Running', '126', 'Active workers'],
    ['Queued', '318', 'Waiting execution'],
    ['Completed Today', '17,624', 'Since midnight'],
    ['Failed', '24', 'Needs action'],
    ['Retry Queue', '18', 'Scheduled retries'],
    ['Average Execution Time', '2.4 sec', 'p50 today'],
    ['Queue Health', '98%', 'Overall readiness'],
  ],

  queues: [
    ['AI Generation Queue', 642, 18, 42, 116, 5, '8s', '1,280/hr', 96],
    ['Video Rendering Queue', 214, 12, 28, 72, 9, '34s', '360/hr', 84],
    ['Publishing Queue', 188, 10, 18, 46, 3, '16s', '520/hr', 93],
    ['Analytics Queue', 336, 14, 24, 82, 1, '6s', '1,920/hr', 98],
    ['Notification Queue', 120, 8, 12, 24, 0, '2s', '4,200/hr', 99],
    ['Learning Queue', 156, 9, 14, 38, 2, '22s', '310/hr', 91],
    ['Workflow Queue', 292, 16, 34, 64, 2, '10s', '980/hr', 97],
    ['Integration Queue', 174, 8, 13, 51, 4, '28s', '240/hr', 88],
    ['Storage Queue', 84, 6, 8, 18, 0, '3s', '1,100/hr', 99],
    ['Email Queue', 92, 5, 6, 21, 1, '12s', '780/hr', 95],
  ].map(([name, currentJobs, workers, running, queued, failed, averageWait, throughput, health]) => ({
    name,
    currentJobs,
    workers,
    running,
    queued,
    failed,
    averageWait,
    throughput,
    health,
  })) as QueueMetric[],

  timeline: ['Queued', 'Starting', 'Running', 'Completed', 'Analytics', 'Learning'],

  jobs: [
    ['JOB-91284', 'Generate script batch', 'Content Production', 'AI Generation Queue', 'High', 'Running', 'Worker 1', 72, '1.8 sec', '10:31 AM', '12s', 0, 'AI Producer'],
    ['JOB-91283', 'Render product launch video', 'Video Studio', 'Video Rendering Queue', 'Critical', 'Running', 'Worker 2', 48, '44 sec', '10:30 AM', '1m 20s', 1, 'Video Ops'],
    ['JOB-91282', 'Publish YouTube short', 'Publishing Center', 'Publishing Queue', 'High', 'Retrying', 'Worker 4', 63, '12 sec', '10:29 AM', '28s', 2, 'Growth Team'],
    ['JOB-91281', 'Aggregate content analytics', 'Analytics', 'Analytics Queue', 'Medium', 'Completed', 'Worker 3', 100, '2.1 sec', '10:28 AM', '-', 0, 'Insights Team'],
    ['JOB-91280', 'Generate thumbnail variants', 'Creative Studio', 'AI Generation Queue', 'Medium', 'Queued', 'Unassigned', 0, '-', '-', '3m', 0, 'Creative Ops'],
    ['JOB-91279', 'Sync channel comments', 'Community Management', 'Integration Queue', 'Low', 'Pending', 'Worker 5', 12, '3 sec', '10:27 AM', '2m', 0, 'Community Team'],
    ['JOB-91278', 'Run learning feedback loop', 'AI Learning Center', 'Learning Queue', 'High', 'Failed', 'Worker 2', 38, '19 sec', '10:25 AM', '-', 3, 'AI Infra'],
    ['JOB-91277', 'Clean temporary render assets', 'Storage', 'Storage Queue', 'Low', 'Running', 'Worker 5', 88, '5 sec', '10:24 AM', '4s', 0, 'Platform'],
  ].map(([id, name, module, queue, priority, status, worker, progress, executionTime, started, eta, retries, owner]) => ({
    id,
    name,
    module,
    queue,
    priority,
    status,
    worker,
    progress,
    executionTime,
    started,
    eta,
    retries,
    owner,
  })) as Job[],

  failedJobs: [
    ['Run learning feedback loop', 'Provider timeout', 'OpenAI response exceeded execution deadline', 3, '10:38 AM', 'Worker 2', 'Retry with lower batch size'],
    ['Publish YouTube short', 'Rate limited', 'YouTube API quota temporarily exceeded', 2, '10:36 AM', 'Worker 4', 'Backoff and retry'],
    ['Sync TikTok analytics', 'Auth expired', 'OAuth refresh token invalid', 4, 'Manual', 'Worker 5', 'Reconnect channel'],
    ['Render long-form video', 'Worker memory pressure', 'ffmpeg process killed by memory guard', 1, '10:42 AM', 'Worker 2', 'Move to high-memory worker'],
  ],

  scheduledJobs: [
    ['Generate Daily Report', '0 6 * * *', 'Tomorrow 06:00', 'Daily', 'Reports', true, 'Ops', 'Ready'],
    ['YouTube Sync', '*/15 * * * *', '10:45 AM', '15 minutes', 'Publishing Center', true, 'Growth', 'Ready'],
    ['SEO Analysis', '0 */4 * * *', '12:00 PM', '4 hours', 'SEO Intelligence', true, 'SEO Team', 'Ready'],
    ['Database Cleanup', '0 2 * * SUN', 'Sunday 02:00', 'Weekly', 'Platform', true, 'DBA', 'Ready'],
    ['Learning Model Update', '0 1 * * *', 'Tomorrow 01:00', 'Daily', 'AI Learning Center', false, 'AI Infra', 'Paused'],
    ['Thumbnail Optimization', '*/30 * * * *', '11:00 AM', '30 minutes', 'Creative Studio', true, 'Creative Ops', 'Ready'],
    ['Analytics Aggregation', '*/5 * * * *', '10:35 AM', '5 minutes', 'Analytics', true, 'Insights', 'Running'],
  ],

  workers: [
    ['Worker 1', 28, 64, 58, 98, 'Generate script batch'],
    ['Worker 2', 31, 82, 76, 84, 'Render product launch video'],
    ['Worker 3', 18, 46, 51, 99, 'Analytics aggregation'],
    ['Worker 4', 23, 71, 62, 91, 'Publishing retry batch'],
    ['Worker 5', 26, 58, 69, 95, 'Storage cleanup'],
  ].map(([name, runningJobs, cpu, memory, health, currentTask]) => ({
    name,
    runningJobs,
    cpu,
    memory,
    health,
    currentTask,
  })) as Worker[],

  distributions: [
    ['Jobs by Module', [['Content', 32], ['Video', 18], ['Publishing', 16], ['Analytics', 24], ['Learning', 10]]],
    ['Jobs by Status', [['Completed', 72], ['Running', 12], ['Queued', 18], ['Failed', 4], ['Retrying', 3]]],
    ['Jobs by Queue', [['AI', 28], ['Video', 18], ['Workflow', 22], ['Integration', 14], ['Email', 8]]],
    ['Jobs by Priority', [['Critical', 8], ['High', 24], ['Medium', 46], ['Low', 22]]],
    ['Jobs by Duration', [['<1s', 18], ['1-5s', 52], ['5-30s', 20], ['>30s', 10]]],
    ['Jobs by Worker', [['W1', 24], ['W2', 30], ['W3', 18], ['W4', 21], ['W5', 25]]],
  ],

  events: [
    ['10:31', 'Video Render Completed'],
    ['10:31', 'AI Research Finished'],
    ['10:32', 'Publishing Started'],
    ['10:33', 'YouTube Upload Completed'],
    ['10:34', 'Learning Feedback Generated'],
  ],

  dependencyFlow: ['Content Generation', 'Thumbnail Generation', 'Voice Generation', 'Video Rendering', 'Quality Review', 'Approval', 'Publishing', 'Analytics', 'Learning'],

  rightPanel: {
    criticalAlerts: ['Payment webhook retry queue rising', 'Video worker memory pressure'],
    longRunningJobs: ['Render product launch video - 44 sec', 'Learning feedback batch - 19 sec'],
    stuckJobs: ['TikTok analytics sync', 'Failed webhook replay'],
    workerFailures: ['Worker 2 memory guard triggered', 'Worker 4 publishing retry spike'],
    highQueueLength: ['AI Generation Queue: 116 queued', 'Analytics Queue: 82 queued'],
    resourceWarnings: ['GPU render pool at 82%', 'Queue Redis memory at 76%'],
    recommendedActions: ['Scale AI queue workers', 'Restart Worker 2 after current job', 'Reconnect TikTok OAuth', 'Reduce video render concurrency'],
  },

  bottom: [
    ['Execution Statistics', '18,462 jobs processed', '2.4 sec avg execution', '99.2% under SLA'],
    ['Worker Utilization', '64% avg CPU', '63% avg memory', '5 active workers'],
    ['Historical Queue Length', '318 current queued', '412 peak today', '184 low today'],
    ['Average Job Duration', '2.4 sec average', '910ms fastest queue', '44 sec slowest active'],
    ['Job Success Rate', '99.31% today', '24 failed jobs', '18 retrying'],
    ['Retry Trend', '+12% vs yesterday', '18 queued retries', '4 manual review'],
  ],
}
