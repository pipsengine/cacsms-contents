export type QueueJob<TPayload = unknown> = {
  name: string
  payload: TPayload
  priority?: number
  delayMs?: number
}

const memoryQueue: QueueJob[] = []

export const queueClient = {
  async add<TPayload>(job: QueueJob<TPayload>) {
    memoryQueue.push(job as QueueJob)
    return { id: `mem_${memoryQueue.length}`, ...job }
  },

  async list() {
    return [...memoryQueue]
  },
}
