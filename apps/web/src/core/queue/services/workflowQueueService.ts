import { Queue } from 'bullmq'

type WorkflowJob = {
  instanceId?: string
  workflowCode?: string
  runId?: string
  agentCode?: string
  correlationId?: string
}

const redisUrl = process.env.REDIS_URL
const bullQueues = new Map<string, Queue<WorkflowJob>>()

function getBullQueue(name: string) {
  if (!redisUrl) return null
  const existing = bullQueues.get(name)
  if (existing) return existing

  const queue = new Queue<WorkflowJob>(name, {
    connection: { url: redisUrl },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  })
  bullQueues.set(name, queue)
  return queue
}

export const workflowQueueService = {
  async enqueue(name: string, job: WorkflowJob) {
    const bullQueue = getBullQueue(name)
    if (!bullQueue) {
      return { id: `memory-${crypto.randomUUID()}`, source: 'memory' as const }
    }

    const queued = await bullQueue.add('execute-workflow', job, {
      jobId: `${job.workflowCode ?? job.agentCode}:${job.instanceId ?? job.runId}`,
    })
    return { id: String(queued.id), source: 'bullmq' as const }
  },
}
